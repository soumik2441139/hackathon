// Load env: try local dev paths first, then fall back to process.env (Azure App Settings)
require('dotenv').config({ path: '../opushire-backend/.env' });
require('dotenv').config({ path: '.env' });

const { MongoClient } = require('mongodb');

const POLL_INTERVAL = 60 * 1000; // Run check every 1 minute
const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const THREE_WEEKS_MS = 21 * 24 * 60 * 60 * 1000;
const isSingleRun = process.argv.includes('--single-run');

async function incrementStat(db, metric, amount = 1) {
    const today = new Date().toISOString().split('T')[0];
    await db.collection('botstats').updateOne(
        { date: today },
        { $inc: { [metric]: amount } },
        { upsert: true }
    );
}

async function runCleanup() {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error('Missing environment variable MONGODB_URI');

    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db();

    console.log(`🧹 Bot 4 (Cleanup): Connected to database. Mode: ${isSingleRun ? 'Single Run' : 'Continuous'}`);

    const cleanupOnce = async () => {
        try {
            const now = new Date();
            const oneWeekAgo = new Date(now.getTime() - ONE_WEEK_MS);
            const threeWeeksAgo = new Date(now.getTime() - THREE_WEEKS_MS);

            let archivedCount = 0;

            const jobsToHardDelete = await db.collection('jobs').find({
                createdAt: { $lt: threeWeeksAgo }
            }).toArray();

            if (jobsToHardDelete.length > 0) {
                console.log(`[Cleanup] Found ${jobsToHardDelete.length} jobs older than 3 weeks. Initiating hard wipe...`);
                for (const job of jobsToHardDelete) {
                    await db.collection('students').updateMany(
                        {},
                        { $pull: { savedJobs: job._id } }
                    );
                    await db.collection('jobs').deleteOne({ _id: job._id });
                    console.log(`     🗑️  Completely deleted expired job: ${job.title}`);
                }
            }

            const jobsToArchive = await db.collection('jobs').find({
                createdAt: { $lt: oneWeekAgo, $gte: threeWeeksAgo },
                isArchived: { $ne: true }
            }).toArray();

            if (jobsToArchive.length > 0) {
                console.log(`[Cleanup] Found ${jobsToArchive.length} jobs older than 1 week. Archiving from main feed...`);
                for (const job of jobsToArchive) {
                    await db.collection('jobs').updateOne(
                        { _id: job._id },
                        { $set: { isArchived: true } }
                    );
                    console.log(`     📦 Archived job: ${job.title}`);
                    archivedCount++;
                }
            }

            if (archivedCount > 0) {
                await incrementStat(db, 'jobsArchived', archivedCount);
            }
        } catch (err) {
            console.error('Cleanup Error:', err);
        }
    };

    if (isSingleRun) {
        await cleanupOnce();
        console.log('🧹 Cleanup finished single run. Exiting.');
        await client.close();
        process.exit(0);
    } else {
        while (true) {
            await cleanupOnce();
            await new Promise(r => setTimeout(r, POLL_INTERVAL));
        }
    }
}

runCleanup().catch(console.error);
