import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import Resume from '../models/Resume';
import { extractLinkedInProfile } from '../services/enrichment/linkedin.service';

export async function enrichLinkedIn(req: AuthRequest, res: Response): Promise<Response | void> {
    try {
        const { linkedinUrl } = req.body;

        if (!linkedinUrl) {
            return res.status(400).json({ error: "LinkedIn URL is required" });
        }

        const resume = await Resume.findOne({ userId: req.user?.id });
        if (!resume) {
            return res.status(404).json({ error: "Resume not found" });
        }

        const data = await extractLinkedInProfile(linkedinUrl);

        resume.extraData = resume.extraData || {};
        resume.extraData.certifications = [
            ...(resume.extraData.certifications || []),
            ...(data.certifications || [])
        ];
        
        // Deduplicate
        resume.extraData.certifications = [...new Set(resume.extraData.certifications)];
        resume.extraData.linkedin = linkedinUrl;

        resume.markModified('extraData');
        await resume.save();

        res.json({ success: true, extraData: resume.extraData });

    } catch (err) {
        console.error("LinkedIn enrichment failed:", err);
        res.status(500).json({ error: "LinkedIn enrichment failed" });
    }
}
