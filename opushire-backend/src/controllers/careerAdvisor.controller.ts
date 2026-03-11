import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import Resume from '../models/Resume';
import { generateCareerInsights } from '../services/advisor/careerAdvisor.service';

export async function getCareerInsights(req: AuthRequest, res: Response): Promise<Response | void> {
    try {
        const resume = await Resume.findOne({ userId: req.user?.id });

        if (!resume) {
            return res.status(404).json({ error: "Resume not found" });
        }

        const insights = await generateCareerInsights(resume);

        if (!insights) {
            return res.json({ gaps: [], learningPath: [] });
        }

        // Cache insights to the resume profile
        resume.extraData = resume.extraData || {};
        resume.extraData.skillGaps = insights.gaps;
        resume.extraData.learningPath = insights.learningPath;
        
        // Mongoose needs this when updating Mixed/Map schemas
        resume.markModified('extraData');
        await resume.save();

        res.json(insights);
    } catch (err) {
        console.error("Failed to generate career insights:", err);
        res.status(500).json({ error: "Failed to generate insights" });
    }
}
