import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import Resume from '../models/Resume';
import { generateSignedCdnUrl } from '../services/storage/cdnSignedUrl.service';

export const getMyResume = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        // Enforce strong isolation (Student can ONLY pull their own Resume ID)
        const resume = await Resume.findOne({ userId: req.user?.id }).sort({ createdAt: -1 });
        
        if (!resume) {
            res.status(404).json({ error: "Resume not found" });
            return;
        }

        // Generate an ephemeral 10-minute proxy URL natively hooked to the CDN
        const secureUrl = generateSignedCdnUrl(resume.fileUrl, 10);
        
        res.json({ success: true, url: secureUrl });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
