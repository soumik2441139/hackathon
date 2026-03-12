// Load env: try local dev paths first, then fall back to process.env (Azure App Settings)
require('dotenv').config({ path: '../../opushire-backend/.env' });
require('dotenv').config({ path: '../../recruiter-bot/.env' });
require('dotenv').config({ path: '.env' });

const { MongoClient } = require('mongodb');

const POLL_INTERVAL = 20000; // Check DB every 20 seconds
const isSingleRun = process.argv.includes('--single-run');

// State machine: valid transitions from PENDING_REVIEW
function buildStatusUpdate(from, to, actor, extra = {}) {
    const VALID = { 'PENDING_REVIEW': ['READY_TO_APPLY', 'NEEDS_SHORTENING'] };
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

async function evaluateKeywords(originalTags, proposedTags, apiKey) {
    const prompt = `You are a strict QA bot. The original job requirements were:\n`
        + originalTags.join('\n')
        + `\n\nAnother bot summarized these into the following keywords:\n`
        + proposedTags.join(', ')
        + `\n\nAre these proposed keywords an accurate representation of the original requirements? They do not have to be perfect, but they must NOT be hallucinations and they MUST be related to the original skill requirements. Answer ONLY with the word YES or NO.`;

    const response = await fetch(`https://api.groq.com/openai/v1/chat/completions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "user", content: prompt }]
        })
    });
    const data = await response.json();

    if (data.choices && data.choices[0].message.content) {
        let text = data.choices[0].message.content.trim().toUpperCase();
        return text.includes('YES');
    }
    return false;
}

async function runSupervisor() {
    const uri = process.env.MONGODB_URI;
    const apiKey = process.env.GROQ_API_KEY;

    if (!uri || !apiKey) throw new Error('Missing environment variables MONGODB_URI or GROQ_API_KEY');

    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db();

    console.log(`⚖️ Bot 3 (Supervisor): Connected to database. Mode: ${isSingleRun ? 'Single Run' : 'Continuous'}`);

    const superviseOnce = async () => {
        try {
            let approvals = 0;
            let hallucinations = 0;
            let job;
            // Atomic claim: one job at a time
            while ((job = await db.collection('jobs').findOneAndUpdate(
                { tagTileStatus: 'PENDING_REVIEW', _claimedBy: { $exists: false } },
                { $set: { _claimedBy: 'bot3-supervisor', _claimedAt: new Date() } },
                { returnDocument: 'after' }
            ))) {
                console.log(`  -> Reviewing tags for: ${job.title}...`);
                try {
                    const originalLongTags = job.longTagsToFix || job.tags.filter(t => t.length > 25);
                    const isApproved = await evaluateKeywords(originalLongTags, job.proposedTags, apiKey);

                    if (isApproved) {
                        const update = buildStatusUpdate('PENDING_REVIEW', 'READY_TO_APPLY', 'bot3-supervisor', {
                            verifiedTags: job.proposedTags,
                        });
                        update.$unset = { longTagsToFix: "", proposedTags: "", _claimedBy: "", _claimedAt: "" };
                        await db.collection('jobs').updateOne({ _id: job._id }, update);
                        console.log(`     ✅ APPROVED: "${job.proposedTags.join(', ')}". Sent to Admin Queue (READY_TO_APPLY).`);
                        approvals++;
                    } else {
                        const update = buildStatusUpdate('PENDING_REVIEW', 'NEEDS_SHORTENING', 'bot3-supervisor');
                        update.$unset = { proposedTags: "", _claimedBy: "", _claimedAt: "" };
                        await db.collection('jobs').updateOne({ _id: job._id }, update);
                        console.log(`     ❌ REJECTED! Hallucination detected. Sending back to Bot 2.`);
                        hallucinations++;
                    }
                } catch (err) {
                    console.error(`     Failed to review job ${job._id}:`, err);
                    await db.collection('jobs').updateOne({ _id: job._id }, {
                        $set: { tagTileStatus: 'FAILED' },
                        $unset: { _claimedBy: '', _claimedAt: '' }
                    });
                }
            }

            if (approvals > 0) {
                await incrementStat(db, 'approvals', approvals);
                await logInsight(db, 'bot3-supervisor', 'Supervisor', `✅ QA Approved tags for ${approvals} jobs`, approvals);
            }
            if (hallucinations > 0) {
                await incrementStat(db, 'hallucinationsCaught', hallucinations);
                await logInsight(db, 'bot3-supervisor', 'Supervisor', `❌ QA Rejected ${hallucinations} jobs (Hallucination caught)`, hallucinations);
            }

        } catch (err) {
            console.error('Supervisor Error:', err);
        }
    };

    if (isSingleRun) {
        await superviseOnce();
        console.log('⚖️ Supervisor finished single run. Exiting.');
        await client.close();
        process.exit(0);
    } else {
        while (true) {
            await superviseOnce();
            await new Promise(r => setTimeout(r, POLL_INTERVAL));
        }
    }
}

runSupervisor().catch(console.error);
