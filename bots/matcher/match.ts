import Resume from '../../opushire-backend/src/models/Resume';
import { getMatches } from '../../opushire-backend/src/services/matching/match.service';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../opushire-backend/.env') });

const SINGLE_RUN = process.argv.includes('--single-run');
const POLL_INTERVAL_MS = 60 * 1000;

async function runOnce() {
    const { connectDBBlocking } = await import('../../opushire-backend/src/config/db');
    await connectDBBlocking();

    const resumes = await Resume.find({ matched: false });
    if (resumes.length === 0) return;

    console.log(`[Matcher Bot] Found ${resumes.length} unmatched resumes.`);

    for (const r of resumes) {
        if (!r.parsedData) continue;

        const matches = await getMatches(r.rawText, r.parsedData);
        r.matches = matches;
        r.matched = true;
        await r.save();
    }

    console.log(`[Matcher Bot] Successfully matched ${resumes.length} resumes.`);
}

async function runSafely() {
    try {
        await runOnce();
    } catch (e) {
        console.error('[Matcher Bot] Error:', e);
    }
}

async function runSingleMode() {
    const { disconnectDB } = await import('../../opushire-backend/src/config/db');
    try {
        await runOnce();
        process.exitCode = 0;
    } catch (e) {
        console.error('[Matcher Bot] Error:', e);
        process.exitCode = 1;
    } finally {
        await disconnectDB();
    }
}

if (SINGLE_RUN) {
    void runSingleMode();
} else {
    void runSafely();
    setInterval(() => {
        void runSafely();
    }, POLL_INTERVAL_MS);
}
