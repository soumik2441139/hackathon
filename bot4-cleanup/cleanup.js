// Load env: try local dev paths first, then fall back to process.env (Azure App Settings)
require('dotenv').config({ path: '../opushire-backend/.env' });
require('dotenv').config({ path: '.env' });

const { MongoClient } = require('mongodb');

const POLL_INTERVAL = 60 * 1000; // Run check every 1 minute
const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const THREE_WEEKS_MS = 21 * 24 * 60 * 60 * 1000;

async function runCleanup() {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error('Missing environment variable MONGODB_URI');

    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db();

    console.log('🧹 Bot 4 (Cleanup): Connected to database. Standing by for job archivals...');

    while (true) {
        try {
            const now = new Date();
            const oneWeekAgo = new Date(now.getTime() - ONE_WEEK_MS);
            const threeWeeksAgo = new Date(now.getTime() - THREE_WEEKS_MS);

            // 1. HARD DELETION (Older than 3 weeks)
            // Completely erase from database AND from students' saved lists.
            const jobsToHardDelete = await db.collection('jobs').find({
                createdAt: { $lt: threeWeeksAgo }
            }).toArray();

            if (jobsToHardDelete.length > 0) {
                console.log(`[Cleanup] Found ${jobsToHardDelete.length} jobs older than 3 weeks. Initiating hard wipe...`);
                for (const job of jobsToHardDelete) {
                    // Pull from all students
                    await db.collection('students').updateMany(
                        {},
                        { $pull: { savedJobs: job._id } }
                    );
                    // Erase job
                    await db.collection('jobs').deleteOne({ _id: job._id });
                    console.log(`     🗑️  Completely deleted expired job: ${job.title}`);
                }
            }

            // 2. SOFT ARCHIVING (Older than 1 week but newer than 3 weeks)
            // Hidden from main feed, but kept in DB so anyone who saved it can still view it
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
                }
            }
        } catch (err) {
            console.error('Cleanup Error:', err);
        }

        await new Promise(r => setTimeout(r, POLL_INTERVAL));
    }
}

runCleanup().catch(console.error);
