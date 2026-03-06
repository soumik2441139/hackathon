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

async function runScanner() {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error('MONGODB_URI not found');

    const client = new MongoClient(uri);
    await client.connect();
    console.log(`🤖 Bot 1 (Scanner): Connected to MongoDB. Mode: ${isSingleRun ? 'Single Run' : 'Continuous'}`);

    const db = client.db();

    const scanOnce = async () => {
        try {
            const unvettedJobs = await db.collection('jobs').find({
                tagTileStatus: { $nin: ['VETTED', 'NEEDS_SHORTENING', 'FAILED', 'READY_TO_APPLY'] }
            }).toArray();

            if (unvettedJobs.length > 0) {
                console.log(`[Scan] Found ${unvettedJobs.length} new or unvetted jobs. Analyzing tags...`);
            }

            let flaggedCount = 0;

            for (const job of unvettedJobs) {
                if (!job.tags || !Array.isArray(job.tags)) {
                    await db.collection('jobs').updateOne({ _id: job._id }, { $set: { tagTileStatus: 'VETTED' } });
                    continue;
                }

                const longTags = job.tags.filter(tag => tag.length > 25 || tag.split(' ').length > 3);

                if (longTags.length > 0) {
                    await db.collection('jobs').updateOne(
                        { _id: job._id },
                        {
                            $set: {
                                tagTileStatus: 'NEEDS_SHORTENING',
                                longTagsToFix: longTags
                            }
                        }
                    );
                    flaggedCount++;
                    console.log(`  -> Flagged: "${job.title}" for bad tags.`);
                } else {
                    await db.collection('jobs').updateOne(
                        { _id: job._id },
                        { $set: { tagTileStatus: 'VETTED' } }
                    );
                }
            }

            if (flaggedCount > 0) {
                console.log(`[Scan] Flagged ${flaggedCount} jobs for the Fixer bot.`);
                await incrementStat(db, 'anomaliesFound', flaggedCount);
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
