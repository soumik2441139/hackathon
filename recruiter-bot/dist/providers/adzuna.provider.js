"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchAdzunaJobs = fetchAdzunaJobs;
/**
 * Adzuna Job Provider — Phase 2
 *
 * To enable:
 * 1. Sign up at https://developer.adzuna.com
 * 2. Set ADZUNA_APP_ID and ADZUNA_API_KEY in your .env
 */
async function fetchAdzunaJobs() {
    const appId = process.env.ADZUNA_APP_ID;
    const apiKey = process.env.ADZUNA_API_KEY;
    if (!appId || !apiKey) {
        console.log('⏭️  [Adzuna] Skipped — no API keys configured');
        return [];
    }
    // TODO: Implement when user provides API keys
    console.log('⏭️  [Adzuna] Stub — implementation pending');
    return [];
}
//# sourceMappingURL=adzuna.provider.js.map