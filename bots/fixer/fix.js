// Load env: try local dev paths first, then fall back to process.env (Azure App Settings)
require('dotenv').config({ path: '../../opushire-backend/.env' });
require('dotenv').config({ path: '../../recruiter-bot/.env' });
require('dotenv').config({ path: '.env' });

const { MongoClient } = require('mongodb');

const POLL_INTERVAL = 15000; // Check DB every 15 seconds
const isSingleRun = process.argv.includes('--single-run');
const CLAIM_TIMEOUT_MS = Math.max(60_000, Number(process.env.BOT_CLAIM_TIMEOUT_MS || '1200000')); // 20 min

const STOP_WORDS = new Set([
    'and', 'or', 'the', 'with', 'for', 'from', 'into', 'onto', 'your', 'you', 'our', 'their',
    'that', 'this', 'these', 'those', 'have', 'has', 'had', 'will', 'can', 'must', 'should',
    'ability', 'required', 'requirements', 'requirement', 'skills', 'skill', 'experience',
    'knowledge', 'strong', 'good', 'working', 'using', 'use', 'plus', 'preferred', 'nice',
    'to', 'of', 'in', 'on', 'at', 'by', 'as', 'an', 'a', 'is', 'are', 'be'
]);

// State machine: valid transitions from NEEDS_SHORTENING
function buildStatusUpdate(from, to, actor, extra = {}) {
    const VALID = {
        'NEEDS_SHORTENING': ['PENDING_REVIEW', 'FAILED', 'VETTED'],
        'FAILED': ['NEEDS_SHORTENING']
    };
    if (!VALID[from]?.includes(to)) {
        throw new Error(`Invalid transition: ${from} → ${to}`);
    }
    return {
        $set: { tagTileStatus: to, ...extra },
        $push: { statusHistory: { from, to, actor, timestamp: new Date() } },
    };
}

async function incrementStat(db, metric, amount = 1) {
    const today = new Date().toISOString().split('T')[0];
    await db.collection('botstats').updateOne(
        { date: today },
        { $inc: { [metric]: amount } },
        { upsert: true }
    );
}

async function logInsight(db, botId, botName, insight, count = 1) {
    const today = new Date().toISOString().split('T')[0];
    await db.collection('botreports').findOneAndUpdate(
        { date: today, botId },
        {
            $setOnInsert: { botName, createdAt: new Date() },
            $push: {
                actions: { timestamp: new Date(), action: insight, count }
            },
            $inc: { 'summary.totalActions': 1, 'summary.jobsProcessed': count },
            $set: { updatedAt: new Date() }
        },
        { upsert: true }
    );
}

function normalizeKeyword(text) {
    return text
        .replace(/[^a-zA-Z0-9+#\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function parseCommaSeparatedKeywords(text) {
    return text
        .replace(/[*_]/g, '')
        .replace(/\n/g, ', ')
        .split(',')
        .map(k => normalizeKeyword(k).toUpperCase())
        .filter(Boolean)
        .slice(0, 3);
}

function extractFallbackKeywords(lines) {
    const counts = new Map();

    for (const line of lines || []) {
        const cleaned = String(line || '').toLowerCase().replace(/[^a-z0-9+#\s]/g, ' ');
        const words = cleaned.split(/\s+/).filter(Boolean);
        for (const word of words) {
            if (word.length < 3) continue;
            if (STOP_WORDS.has(word)) continue;
            counts.set(word, (counts.get(word) || 0) + 1);
        }
    }

    const topSingles = [...counts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([word]) => word.toUpperCase());

    return [...new Set(topSingles)].slice(0, 3);
}

async function generateKeywords(longTags, apiKey) {
    const prompt = `Extract exactly 3 concise keywords (maximum 2 words each) from these required skills lines:\n`
        + longTags.join('\n')
        + `\nReturn ONLY a comma-separated list of keywords, nothing else. Format: KEYWORD1, KEYWORD2, KEYWORD3`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        const rawBody = await response.text();
        let data = {};
        if (rawBody) {
            try {
                data = JSON.parse(rawBody);
            } catch {
                throw new Error('Gemini returned invalid JSON');
            }
        }

        if (!response.ok) {
            const apiMessage = data?.error?.message || `Gemini HTTP ${response.status}`;
            throw new Error(apiMessage);
        }

        const llmText = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
        const parsed = parseCommaSeparatedKeywords(llmText);
        if (parsed.length > 0) {
            return { keywords: parsed, source: 'gemini' };
        }
        throw new Error('Gemini response had no usable keyword output');
    } catch (err) {
        const fallback = extractFallbackKeywords(longTags);
        if (fallback.length > 0) {
            return {
                keywords: fallback,
                source: 'fallback',
                warning: err?.message || 'Gemini request failed'
            };
        }
        throw err;
    }
}

async function runFixer() {
    const uri = process.env.MONGODB_URI;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!uri || !apiKey) throw new Error('Missing environment variables MONGODB_URI or GEMINI_API_KEY');

    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db();

    console.log(`🛠 Bot 2 (Fixer): Connected to database. Mode: ${isSingleRun ? 'Single Run' : 'Continuous'}`);

    const fixOnce = async () => {
        try {
            let fixedCount = 0;
            let fallbackCount = 0;
            let job;
            const claimExpiry = new Date(Date.now() - CLAIM_TIMEOUT_MS);
            // Atomic claim: one job at a time
            while ((job = await db.collection('jobs').findOneAndUpdate(
                {
                    $and: [
                        {
                            $or: [
                                { tagTileStatus: 'NEEDS_SHORTENING' },
                                {
                                    tagTileStatus: 'FAILED',
                                    longTagsToFix: { $exists: true, $ne: [] },
                                    $or: [
                                        { proposedTags: { $exists: false } },
                                        { proposedTags: { $size: 0 } }
                                    ]
                                }
                            ]
                        },
                        {
                            $or: [
                                { _claimedBy: { $exists: false } },
                                { _claimedAt: { $lt: claimExpiry } }
                            ]
                        }
                    ]
                },
                { $set: { _claimedBy: 'bot2-fixer', _claimedAt: new Date() } },
                { returnDocument: 'after', sort: { updatedAt: 1 } }
            ))) {
                if (job.tagTileStatus === 'FAILED') {
                    const reopenUpdate = buildStatusUpdate('FAILED', 'NEEDS_SHORTENING', 'bot2-fixer');
                    reopenUpdate.$unset = { proposedTags: '' };
                    await db.collection('jobs').updateOne({ _id: job._id }, reopenUpdate);
                    job.tagTileStatus = 'NEEDS_SHORTENING';
                }

                console.log(`  -> Processing LLM rewrite for: ${job.title}...`);
                try {
                    const sourceTags = (Array.isArray(job.longTagsToFix) && job.longTagsToFix.length > 0)
                        ? job.longTagsToFix
                        : (Array.isArray(job.tags) ? job.tags : []);
                    const keywordResult = await generateKeywords(sourceTags, apiKey);
                    const newKeywords = keywordResult.keywords;

                    if (keywordResult.source === 'fallback') {
                        fallbackCount++;
                        console.warn(`     Gemini unavailable. Fallback keywords used. Reason: ${keywordResult.warning}`);
                    }

                    if (newKeywords.length > 0) {
                        const existingTags = Array.isArray(job.tags) ? job.tags : [];
                        const goodTags = existingTags.filter(tag => !(tag.length > 25 || tag.split(' ').length > 3));
                        const finalTags = [...new Set([...goodTags, ...newKeywords])];

                        const update = buildStatusUpdate('NEEDS_SHORTENING', 'PENDING_REVIEW', 'bot2-fixer', { proposedTags: finalTags });
                        update.$unset = { _claimedBy: '', _claimedAt: '' };
                        await db.collection('jobs').updateOne({ _id: job._id }, update);
                        console.log(`     Proposed tags for review (${keywordResult.source}): ${finalTags.join(', ')}`);
                        fixedCount++;
                    } else {
                        const update = buildStatusUpdate('NEEDS_SHORTENING', 'FAILED', 'bot2-fixer');
                        update.$unset = { _claimedBy: '', _claimedAt: '' };
                        await db.collection('jobs').updateOne({ _id: job._id }, update);
                    }
                } catch (err) {
                    console.error(`     Failed to fix job ${job._id}:`, err);
                    const update = buildStatusUpdate('NEEDS_SHORTENING', 'FAILED', 'bot2-fixer');
                    update.$unset = { _claimedBy: '', _claimedAt: '' };
                    await db.collection('jobs').updateOne({ _id: job._id }, update);
                }
            }

            if (fixedCount > 0) {
                await incrementStat(db, 'fixesMade', fixedCount);
                await logInsight(db, 'bot2-fixer', 'Fixer', `🤖 Generated new tags for ${fixedCount} jobs (AI Review Pending)`, fixedCount);
            }

            if (fallbackCount > 0) {
                await logInsight(db, 'bot2-fixer', 'Fixer', `⚠️ Gemini quota/rate limit hit. Used fallback keyword extraction for ${fallbackCount} jobs`, fallbackCount);
            }
        } catch (err) {
            console.error('Fixer Error:', err);
        }
    };

    if (isSingleRun) {
        await fixOnce();
        console.log('🛠 Fixer finished single run. Exiting.');
        await client.close();
        process.exit(0);
    } else {
        while (true) {
            await fixOnce();
            await new Promise(r => setTimeout(r, POLL_INTERVAL));
        }
    }
}

runFixer().catch(console.error);
