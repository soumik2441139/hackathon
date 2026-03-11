import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import Resume from '../models/Resume';

export const getMyMatches = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        // Populate the matched jobs reference
        const resume = await Resume.findOne({ userId: req.user?.id })
            .populate('matches.job');
            
        if (!resume) {
            res.status(404).json({ error: "Resume not found" });
            return;
        }

        res.json({ matches: resume.matches || [] });
    } catch (e) {
        console.error("Failed to fetch matches:", e);
        res.status(500).json({ error: "Server error retrieving matches" });
    }
}
