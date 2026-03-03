require('dotenv').config({ path: '../opushire-backend/.env' });
const { MongoClient } = require('mongodb');

const POLL_INTERVAL = 30000; // Check DB every 30 seconds

async function runScanner() {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error('MONGODB_URI not found');

    const client = new MongoClient(uri);
    await client.connect();
    console.log('🤖 Bot 1 (Scanner): Connected to MongoDB. Running continuous scans...');

    const db = client.db();

    while (true) {
        try {
            // Find jobs that have not been vetted yet (we consider them vetted if tagTileStatus is 'VETTED')
            // This ensures if new jobs are added in the future, they automatically get picked up
            const unvettedJobs = await db.collection('jobs').find({
                tagTileStatus: { $nin: ['VETTED', 'NEEDS_SHORTENING', 'FAILED'] }
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

                // Identify tags that are too long to display cleanly
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
                    // It's clean
                    await db.collection('jobs').updateOne(
                        { _id: job._id },
                        { $set: { tagTileStatus: 'VETTED' } }
                    );
                }
            }

            if (flaggedCount > 0) {
                console.log(`[Scan] Flagged ${flaggedCount} jobs for the Fixer bot.`);
            }
        } catch (err) {
            console.error('Scan Error:', err);
        }

        await new Promise(r => setTimeout(r, POLL_INTERVAL));
    }
}

runScanner().catch(console.error);
