import Resume from '../../opushire-backend/src/models/Resume';
import { getMatches } from '../../opushire-backend/src/services/matching/match.service';
import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
dotenv.config({ path: './opushire-backend/.env' });

async function run() {
    try {
        if (mongoose.connection.readyState !== 1) {
            await mongoose.connect(process.env.MONGODB_URI as string);
        }

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
    } catch (e) {
        console.error("[Matcher Bot] Error:", e);
    }
}

// Run immediately, then every 60 seconds
run();
setInterval(run, 60000);
