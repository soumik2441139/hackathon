/**
 * CLI tool to trigger a fetch without running the server.
 * Usage: npm run fetch
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fetchAllJobs } from './bot.service';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/test';

async function main() {
    console.log('🤖 Recruiter Bot — CLI Mode');
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected\n');

    const status = await fetchAllJobs();

    console.log('\n📊 Summary:');
    for (const r of status.results) {
        console.log(`  [${r.source.toUpperCase()}] ${r.newJobs} new, ${r.duplicates} duplicates, ${r.errors.length} errors`);
    }
    console.log(`\n  TOTAL: ${status.totalNew} new jobs stored\n`);

    if (status.totalNew > 0) {
        const today = new Date().toISOString().split('T')[0];
        try {
            await mongoose.connection.db!.collection('botstats').updateOne(
                { date: today },
                { $inc: { jobsAdded: status.totalNew } },
                { upsert: true }
            );
        } catch (e: any) {
            console.error('Failed to increment BotStat:', e.message);
        }
    }

    await mongoose.disconnect();
    process.exit(0);
}

main().catch(err => {
    console.error('❌ Fatal:', err);
    process.exit(1);
});
