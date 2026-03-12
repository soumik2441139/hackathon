import Resume from '../../opushire-backend/src/models/Resume';
import { extractLinkedInProfile } from '../../opushire-backend/src/services/enrichment/linkedin.service';
import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
dotenv.config({ path: './opushire-backend/.env' });

async function run() {
    try {
        if (mongoose.connection.readyState !== 1) {
            await mongoose.connect(process.env.MONGODB_URI as string);
        }

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

            // Rate-limit: 2s between profiles to avoid being blocked
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        if (enrichedCount > 0) {
            console.log(`[LinkedIn Enroll Bot] Enriched ${enrichedCount} resumes.`);
        }
    } catch (e) {
        console.error("[LinkedIn Enroll Bot] Error:", e);
    }
}

// Run immediately, then every 30 minutes
run();
setInterval(run, 30 * 60 * 1000);
