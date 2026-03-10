"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * CLI tool to trigger a fetch without running the server.
 * Usage: npm run fetch
 */
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const bot_service_1 = require("./bot.service");
dotenv_1.default.config();
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/test';
async function main() {
    console.log('🤖 Recruiter Bot — CLI Mode');
    console.log('📡 Connecting to MongoDB...');
    await mongoose_1.default.connect(MONGODB_URI);
    console.log('✅ Connected\n');
    const status = await (0, bot_service_1.fetchAllJobs)();
    console.log('\n📊 Summary:');
    for (const r of status.results) {
        console.log(`  [${r.source.toUpperCase()}] ${r.newJobs} new, ${r.duplicates} duplicates, ${r.errors.length} errors`);
    }
    console.log(`\n  TOTAL: ${status.totalNew} new jobs stored\n`);
    if (status.totalNew > 0) {
        const today = new Date().toISOString().split('T')[0];
        try {
            await mongoose_1.default.connection.db.collection('botstats').updateOne({ date: today }, { $inc: { jobsAdded: status.totalNew } }, { upsert: true });
            // Detailed insights for the new UI
            for (const r of status.results) {
                if (r.newJobs > 0) {
                    const idList = (r.insertedIds || []).join(', ');
                    const actionInsight = `⚡ Scraped ${r.newJobs} new jobs from ${r.source}. IDs: ${idList}`;
                    await mongoose_1.default.connection.db.collection('botreports').findOneAndUpdate({ date: today, botId: 'bot0-recruiter' }, {
                        $setOnInsert: { botName: 'Recruiter', createdAt: new Date() },
                        $push: {
                            actions: { timestamp: new Date(), action: actionInsight, count: r.newJobs }
                        },
                        $inc: { 'summary.totalActions': 1, 'summary.jobsProcessed': r.newJobs },
                        $set: { updatedAt: new Date() }
                    }, { upsert: true });
                }
            }
        }
        catch (e) {
            console.error('Failed to update stats or reports:', e.message);
        }
    }
    await mongoose_1.default.disconnect();
    process.exit(0);
}
main().catch(err => {
    console.error('❌ Fatal:', err);
    process.exit(1);
});
//# sourceMappingURL=cli.js.map