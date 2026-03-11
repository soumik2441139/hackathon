import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import Resume from '../models/Resume';
import { extractResumeText } from '../utils/resumeTextExtractor';
import { uploadToBlob } from '../services/storage/blob.service';
import { watermarkPdf } from '../services/media/pdfWatermark.service';
import { eventBus } from '../events/eventBus';
import fs from 'fs';

export const uploadResume = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.file) {
            res.status(400).json({ error: "No resume file uploaded" });
            return;
        }

        const localPath = req.file.path;
        
        // 1. Watermark the PDF Student identity
        const wmPath = await watermarkPdf(
          localPath,
          `PRIVATE • ${req.user?.id} • ${new Date().toISOString().split('T')[0]}`
        );

        // 2. Upload to Azure Blob Storage
        const blobUrl = await uploadToBlob(wmPath);

        // 3. Extract Raw Text computationally (from the raw local unwatermarked file)
        const rawText = await extractResumeText(localPath);

        // 4. Clean up ephemeral local files natively preventing App Service bloat
        if (fs.existsSync(localPath)) fs.unlinkSync(localPath);
        if (fs.existsSync(wmPath)) fs.unlinkSync(wmPath);

        // 5. Save metadata to Mongo
        const resume = await Resume.create({
            userId: req.user?.id,
            fileUrl: blobUrl,
            rawText
        });

        // 6. Instantly Trigger background EventBus AI Processing
        eventBus.emit("resume_uploaded", resume._id);

        res.json({ success: true, resumeId: resume._id, message: "Resume uploaded successfully and is analyzing natively." });

    } catch (e: any) {
        console.error("Resume Upload Failed:", e);
        res.status(500).json({ error: e.message || "Resume upload failed" });
    }
};
