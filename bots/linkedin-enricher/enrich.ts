import Resume from '../../opushire-backend/src/models/Resume';
import { mockLinkedInExtract } from '../../opushire-backend/src/services/enrichment/linkedin.service';
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
            
            // In a real scenario, this might check a 'lastEnriched' timestamp to avoid looping

            const data = mockLinkedInExtract(linkedinUrl);

            const currentCerts = r.extraData?.certifications || [];

            r.extraData = {
                ...(r.extraData || {}),
                certifications: [
                    ...currentCerts,
                    ...(data.certifications || [])
                ]
            };
            
            if (r.extraData && r.extraData.certifications) {
                r.extraData.certifications = r.extraData.certifications.filter((val: any, idx: number, arr: any[]) => arr.indexOf(val) === idx);
            }
            
            r.markModified('extraData');
            await r.save();
            enrichedCount++;
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
