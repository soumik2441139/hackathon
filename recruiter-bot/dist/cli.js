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
        console.log(`  ${r.source}: ${r.newJobs} new, ${r.duplicates} duplicates, ${r.errors.length} errors`);
    }
    console.log(`\n  TOTAL: ${status.totalNew} new jobs stored\n`);
    await mongoose_1.default.disconnect();
    process.exit(0);
}
main().catch(err => {
    console.error('❌ Fatal:', err);
    process.exit(1);
});
//# sourceMappingURL=cli.js.map