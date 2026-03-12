// Load env: try local dev paths first, then fall back to process.env (Azure App Settings)
require('dotenv').config({ path: '../../opushire-backend/.env' });
require('dotenv').config({ path: '.env' });
const { MongoClient } = require('mongodb');

const POLL_INTERVAL = 30000; // Check DB every 30 seconds
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

// State machine: valid transitions from OK
const VALID_FROM_OK = ['VETTED', 'NEEDS_SHORTENING'];

function buildStatusUpdate(from, to, actor, extra = {}) {
    if (from === 'OK' && !VALID_FROM_OK.includes(to)) {
        throw new Error(`Invalid transition: ${from} → ${to}`);
    }
    return {
        $set: { tagTileStatus: to, ...extra },
        $push: { statusHistory: { from, to, actor, timestamp: new Date() } },
    };
}

async function runScanner() {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error('MONGODB_URI not found');

    const client = new MongoClient(uri);
    await client.connect();
    console.log(`🤖 Bot 1 (Scanner): Connected to MongoDB. Mode: ${isSingleRun ? 'Single Run' : 'Continuous'}`);

    const db = client.db();

    const scanOnce = async () => {
        try {
            // Atomic claim: pick one unvetted job at a time to prevent duplicates
            let flaggedCount = 0;
            let job;
            while ((job = await db.collection('jobs').findOneAndUpdate(
                {
                    tagTileStatus: { $nin: ['VETTED', 'NEEDS_SHORTENING', 'FAILED', 'READY_TO_APPLY', 'PENDING_REVIEW'] },
                    _claimedBy: { $exists: false },
                },
                { $set: { _claimedBy: 'bot1-scanner', _claimedAt: new Date() } },
                { returnDocument: 'after' }
            ))) {
                if (!job.tags || !Array.isArray(job.tags)) {
                    const update = buildStatusUpdate('OK', 'VETTED', 'bot1-scanner');
                    update.$unset = { _claimedBy: '', _claimedAt: '' };
                    await db.collection('jobs').updateOne({ _id: job._id }, update);
                    continue;
                }

                const longTags = job.tags.filter(tag => tag.length > 25 || tag.split(' ').length > 3);

                if (longTags.length > 0) {
                    const update = buildStatusUpdate('OK', 'NEEDS_SHORTENING', 'bot1-scanner', { longTagsToFix: longTags });
                    update.$unset = { _claimedBy: '', _claimedAt: '' };
                    await db.collection('jobs').updateOne({ _id: job._id }, update);
                    flaggedCount++;
                    console.log(`  -> Flagged: "${job.title}" for bad tags.`);
                } else {
                    const update = buildStatusUpdate('OK', 'VETTED', 'bot1-scanner');
                    update.$unset = { _claimedBy: '', _claimedAt: '' };
                    await db.collection('jobs').updateOne({ _id: job._id }, update);
                }
            }

            if (flaggedCount > 0) {
                console.log(`[Scan] Flagged ${flaggedCount} jobs for the Fixer bot.`);
                await incrementStat(db, 'anomaliesFound', flaggedCount);
                await logInsight(db, 'bot1-scanner', 'Scanner', `🔍 Flagged ${flaggedCount} jobs for AI review (Bad tags)`, flaggedCount);
            }
        } catch (err) {
            console.error('Scan Error:', err);
        }
    };

    if (isSingleRun) {
        await scanOnce();
        console.log('🤖 Scanner finished single run. Exiting.');
        await client.close();
        process.exit(0);
    } else {
        while (true) {
            await scanOnce();
            await new Promise(r => setTimeout(r, POLL_INTERVAL));
        }
    }
}

runScanner().catch(console.error);
