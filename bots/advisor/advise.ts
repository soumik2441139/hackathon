import Resume from '../../opushire-backend/src/models/Resume';
import { generateCareerInsights } from '../../opushire-backend/src/services/advisor/careerAdvisor.service';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../opushire-backend/.env') });

const SINGLE_RUN = process.argv.includes('--single-run');
const POLL_INTERVAL_MS = 10 * 60 * 1000;

async function runOnce() {
    const { connectDBBlocking } = await import('../../opushire-backend/src/config/db');
    await connectDBBlocking();

    // Find resumes that have been matched but don't have learning paths yet
    const resumes = await Resume.find({
        matched: true,
        'extraData.learningPath': { $exists: false }
    });

    if (resumes.length === 0) return;

    console.log(`[Advisor Bot] Found ${resumes.length} resumes needing career advice.`);

    for (const r of resumes) {
        const insights = await generateCareerInsights(r);
        if (!insights) continue;

        r.extraData = r.extraData || {};
        r.extraData.skillGaps = insights.gaps;
        r.extraData.learningPath = insights.learningPath;

        // Mongoose needs to know the map/mixed object changed
        r.markModified('extraData');
        await r.save();
    }

    console.log(`[Advisor Bot] Successfully analyzed ${resumes.length} resumes.`);
}

async function runSafely() {
    try {
        await runOnce();
    } catch (e) {
        console.error('[Advisor Bot] Error:', e);
    }
}

async function runSingleMode() {
    const { disconnectDB } = await import('../../opushire-backend/src/config/db');
    try {
        await runOnce();
        process.exitCode = 0;
    } catch (e) {
        console.error('[Advisor Bot] Error:', e);
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
