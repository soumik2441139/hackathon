// Load env: try local dev paths first, then fall back to process.env (Azure App Settings)
require('dotenv').config({ path: '../../opushire-backend/.env' });
require('dotenv').config({ path: '../../recruiter-bot/.env' });
require('dotenv').config({ path: '.env' });

const { MongoClient } = require('mongodb');

const POLL_INTERVAL = 15000; // Check DB every 15 seconds
const isSingleRun = process.argv.includes('--single-run');

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

async function generateKeywords(longTags, apiKey) {
    const prompt = `Extract exactly 3 concise keywords (maximum 2 words each) from these required skills lines:\n`
        + longTags.join('\n')
        + `\nReturn ONLY a comma-separated list of keywords, nothing else. Format: KEYWORD1, KEYWORD2, KEYWORD3`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
        })
    });
    const data = await response.json();

    if (data.candidates && data.candidates[0].content.parts[0].text) {
        let text = data.candidates[0].content.parts[0].text.trim();
        text = text.replace(/[*_]/g, '').replace(/\n/g, ', ');
        return text.split(',').map(k => k.trim().toUpperCase()).filter(k => k);
    }
    return [];
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
            const jobsToFix = await db.collection('jobs').find({
                tagTileStatus: 'NEEDS_SHORTENING'
            }).toArray();

            if (jobsToFix.length > 0) {
                console.log(`[Fixer] Found ${jobsToFix.length} jobs needing tag shortening...`);
            }

            let fixedCount = 0;

            for (const job of jobsToFix) {
                console.log(`  -> Processing LLM rewrite for: ${job.title}...`);
                try {
                    const newKeywords = await generateKeywords(job.longTagsToFix || job.tags, apiKey);

                    if (newKeywords.length > 0) {
                        const goodTags = job.tags.filter(tag => !(tag.length > 25 || tag.split(' ').length > 3));
                        const finalTags = [...new Set([...goodTags, ...newKeywords])];

                        await db.collection('jobs').updateOne(
                            { _id: job._id },
                            {
                                $set: {
                                    proposedTags: finalTags,
                                    tagTileStatus: 'PENDING_REVIEW'
                                }
                            }
                        );
                        console.log(`     Proposed tags for review: ${finalTags.join(', ')}`);
                        fixedCount++;
                    } else {
                        await db.collection('jobs').updateOne({ _id: job._id }, { $set: { tagTileStatus: 'FAILED' } });
                    }
                } catch (err) {
                    console.error(`     Failed to fix job ${job._id}:`, err);
                    await db.collection('jobs').updateOne({ _id: job._id }, { $set: { tagTileStatus: 'FAILED' } });
                }

                if (!isSingleRun) {
                    await new Promise(r => setTimeout(r, 2000));
                }
            }

            if (fixedCount > 0) {
                await incrementStat(db, 'fixesMade', fixedCount);
                await logInsight(db, 'bot2-fixer', 'Fixer', `🤖 Generated new tags for ${fixedCount} jobs (AI Review Pending)`, fixedCount);
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
