import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import Resume from '../models/Resume';
import { extractResumeText } from '../utils/resumeTextExtractor';
import { uploadToBlob } from '../services/storage/blob.service';
import { watermarkPdf } from '../services/media/pdfWatermark.service';
import { eventBus } from '../events/eventBus';
import { assertSafePath } from '../utils/pathSafety';
import fs from 'fs';
import path from 'path';
import os from 'os';

function hasPdfSignature(filePath: string): boolean {
    let fd: number | null = null;
    try {
        fd = fs.openSync(filePath, 'r');
        const header = Buffer.alloc(5);
        const bytesRead = fs.readSync(fd, header, 0, 5, 0);
        return bytesRead === 5 && header.toString('utf8') === '%PDF-';
    } catch {
        return false;
    } finally {
        if (fd !== null) {
            fs.closeSync(fd);
        }
    }
}

export const uploadResume = async (req: AuthRequest, res: Response): Promise<void> => {
    let localPath: string | undefined;
    let wmPath: string | undefined;

    try {
        if (!req.file) {
            res.status(400).json({ error: "No resume file uploaded" });
            return;
        }

        // Validate that Multer-provided path is within the OS temp directory
        localPath = assertSafePath(req.file.path, os.tmpdir());

        if (!hasPdfSignature(localPath)) {
            res.status(400).json({ error: 'Only valid PDF files are allowed' });
            return;
        }
        
        // 1. Watermark the PDF Student identity
        wmPath = await watermarkPdf(
          localPath,
          `PRIVATE • ${req.user?.id} • ${new Date().toISOString().split('T')[0]}`
        );

        // Security check for the newly generated watermarked path
        assertSafePath(wmPath, os.tmpdir());

        // 2. Upload to Azure Blob Storage
        const blobUrl = await uploadToBlob(wmPath);

        // 3. Extract Raw Text computationally (from the raw local unwatermarked file)
        const rawText = await extractResumeText(localPath);

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
    } finally {
        if (localPath && fs.existsSync(localPath)) {
            fs.unlinkSync(localPath);
        }
        if (wmPath && fs.existsSync(wmPath)) {
            fs.unlinkSync(wmPath);
        }
    }
};
