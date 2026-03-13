import Resume from '../../opushire-backend/src/models/Resume';
import { extractLinkedInProfile } from '../../opushire-backend/src/services/enrichment/linkedin.service';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../opushire-backend/.env') });

const SINGLE_RUN = process.argv.includes('--single-run');
const POLL_INTERVAL_MS = 30 * 60 * 1000;

async function runOnce() {
    const { connectDBBlocking } = await import('../../opushire-backend/src/config/db');
    await connectDBBlocking();

    const resumes = await Resume.find({});
    let enrichedCount = 0;

    for (const r of resumes) {
        const linkedinUrl = r.extraData?.linkedin;
        if (!linkedinUrl) continue;

        // Skip if already enriched in the last 7 days
        const lastEnriched = r.extraData?.lastLinkedInEnrich;
        if (lastEnriched && Date.now() - new Date(lastEnriched).getTime() < 7 * 24 * 60 * 60 * 1000) continue;

        const data = await extractLinkedInProfile(linkedinUrl);

        const currentCerts = r.extraData?.certifications || [];

        r.extraData = {
            ...(r.extraData || {}),
            certifications: [
                ...currentCerts,
                ...(data.certifications || [])
            ],
            lastLinkedInEnrich: new Date().toISOString(),
        };

        if (data.headline) {
            r.extraData.linkedinHeadline = data.headline;
        }

        if (r.extraData && r.extraData.certifications) {
            r.extraData.certifications = r.extraData.certifications.filter((val: any, idx: number, arr: any[]) => arr.indexOf(val) === idx);
        }

        r.markModified('extraData');
        await r.save();
        enrichedCount++;

        // Rate-limit: 2s between profiles to avoid being blocked.
        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    if (enrichedCount > 0) {
        console.log(`[LinkedIn Enricher Bot] Enriched ${enrichedCount} resumes.`);
    }
}

async function runSafely() {
    try {
        await runOnce();
    } catch (e) {
        console.error('[LinkedIn Enricher Bot] Error:', e);
    }
}

async function runSingleMode() {
    const { disconnectDB } = await import('../../opushire-backend/src/config/db');
    try {
        await runOnce();
        process.exitCode = 0;
    } catch (e) {
        console.error('[LinkedIn Enricher Bot] Error:', e);
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
