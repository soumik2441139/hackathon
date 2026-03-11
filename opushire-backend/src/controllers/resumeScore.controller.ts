import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import Resume from '../models/Resume';

export const getMyResumeScore = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const resume = await Resume.findOne({ userId: req.user?.id });
        
        if (!resume) {
            res.status(404).json({ error: "Resume not found" });
            return;
        }

        res.json({
            score: resume.score || 0,
            breakdown: resume.scoreBreakdown || []
        });
    } catch (e) {
        console.error("Failed to fetch resume score:", e);
        res.status(500).json({ error: "Server error retrieving score" });
    }
}
