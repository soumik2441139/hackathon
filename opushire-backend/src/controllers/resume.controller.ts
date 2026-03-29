import { Response } from 'express';
import puppeteer from 'puppeteer';
import { AuthRequest } from '../middleware/auth.middleware';
import Resume from '../models/Resume';
import { extractResumeText } from '../utils/resumeTextExtractor';
import { uploadToBlob } from '../services/storage/blob.service';
import { watermarkPdf } from '../services/media/pdfWatermark.service';
import { eventBus } from '../events/eventBus';
import { assertSafePath } from '../utils/pathSafety';
import { uploadDir } from '../middleware/uploadResume';
import fs from 'fs';
import path from 'path';

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
            res.status(400).json({ error: "No resume file uploaded. Please ensure the file is under 5MB and is a PDF, Word, or Markdown document." });
            return;
        }

        // Fix: Validate that Multer-provided path is within the ACTUAL upload directory
        localPath = assertSafePath(req.file.path, uploadDir);
        const ext = path.extname(localPath).toLowerCase();

        // 1. Format-specific Validation
        if (ext === '.pdf' && !hasPdfSignature(localPath)) {
            res.status(400).json({ error: 'The uploaded file claims to be a PDF but has an invalid signature.' });
            return;
        }
        
        // 2. Watermark if PDF (Confidentiality Layer)
        // If not a PDF, watermarkPdf gracefully returns the original localPath.
        wmPath = await watermarkPdf(
          localPath,
          `PRIVATE • ${req.user?.id} • ${new Date().toISOString().split('T')[0]}`
        );

        // Security check for the resulting processed path
        assertSafePath(wmPath, uploadDir);

        // 3. Upload to Azure Blob Storage
        const blobUrl = await uploadToBlob(wmPath);

        // 4. Extract Raw Text computationally for AI Analysis
        const rawText = await extractResumeText(localPath);

        // 5. Save metadata to Mongo
        const resume = await Resume.create({
            userId: req.user?.id,
            fileUrl: blobUrl,
            rawText,
            format: ext.replace('.', '')
        });

        // 6. Instantly Trigger background EventBus AI Processing
        eventBus.emit("resume_uploaded", resume._id);

        res.json({ 
            success: true, 
            resumeId: resume._id, 
            message: `Resume (${ext.toUpperCase()}) uploaded successfully. AI analysis has begun.` 
        });

    } catch (e: unknown) {
        console.error("Resume Upload Failed:", e);
        res.status(500).json({ error: (e as Error).message || "Resume upload failed" });
    } finally {
        // Cleanup local temp files
        if (localPath && fs.existsSync(localPath)) {
            try { fs.unlinkSync(localPath); } catch {}
        }
        // Only unlink wmPath if it's different from localPath (e.g. for PDFs)
        if (wmPath && wmPath !== localPath && fs.existsSync(wmPath)) {
            try { fs.unlinkSync(wmPath); } catch {}
        }
    }
};

export const buildResumePdf = async (req: AuthRequest, res: Response): Promise<void> => {
    let tempPath: string | undefined;
    try {
        const { html, markdownSource } = req.body;
        if (!html) {
            res.status(400).json({ error: "Missing HTML payload to compile." });
            return;
        }

        // 1. Launch Puppeteer
        const browser = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
            headless: true
        });
        const page = await browser.newPage();
        
        // Inject ATS-friendly styling wrapper
        const compiledDoc = `
            <!DOCTYPE html>
            <html>
                <head>
                    <style>
                        @page { margin: 1in; size: letter; }
                        body { 
                            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                            line-height: 1.5;
                            color: #111;
                            font-size: 11pt;
                        }
                        h1, h2, h3 { color: #000; margin-top: 1em; margin-bottom: 0.5em; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
                        h1 { font-size: 24pt; border: none; text-align: center; margin-bottom: 0; }
                        p, ul { margin-bottom: 0.75em; }
                        ul { padding-left: 20px; }
                        a { color: #0366d6; text-decoration: none; }
                    </style>
                </head>
                <body>${html}</body>
            </html>
        `;

        await page.setContent(compiledDoc, { waitUntil: 'networkidle0' });
        
        tempPath = path.join(uploadDir, `resume_build_${req.user?.id}_${Date.now()}.pdf`);
        await page.pdf({
            path: tempPath,
            format: 'A4',
            printBackground: true
        });

        await browser.close();

        // 2. Upload generated PDF to Azure (the stream logic in blobService handles it)
        const blobUrl = await uploadToBlob(tempPath);

        // 3. Extract text computationally to feed the AI
        const rawText = await extractResumeText(tempPath);

        // 4. Save to DB with markdownSource
        const resume = await Resume.create({
            userId: req.user?.id,
            fileUrl: blobUrl,
            rawText,
            format: 'pdf',
            markdownSource
        });

        // 5. Trigger AI pipeline
        eventBus.emit("resume_uploaded", resume._id);

        res.json({
            success: true,
            resumeId: resume._id,
            message: "Resume successfully compiled and securely vaulted."
        });

    } catch (e: unknown) {
        console.error("Resume Build Failed:", e);
        res.status(500).json({ error: (e as Error).message || "Failed to compile markdown resume." });
    } finally {
        if (tempPath && fs.existsSync(tempPath)) {
            try { fs.unlinkSync(tempPath); } catch {}
        }
    }
};
