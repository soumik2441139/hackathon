import Resume from '../../opushire-backend/src/models/Resume';
import { generateCareerInsights } from '../../opushire-backend/src/services/advisor/careerAdvisor.service';
import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
dotenv.config({ path: './opushire-backend/.env' });

async function run() {
    try {
        if (mongoose.connection.readyState !== 1) {
            await mongoose.connect(process.env.MONGODB_URI as string);
        }

        // Find resumes that have been matched but don't have learning paths yet
        const resumes = await Resume.find({ 
            matched: true, 
            "extraData.learningPath": { $exists: false } 
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
    } catch (e) {
        console.error("[Advisor Bot] Error:", e);
    }
}

// Run immediately, then every 10 minutes
run();
setInterval(run, 10 * 60 * 1000);
