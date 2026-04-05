import express from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { uploadResume, buildResumePdf, buildLatexPdf, getMyResumeData } from '../controllers/resume.controller';
import upload from '../middleware/uploadResume';

const router = express.Router();

router.get('/my', authenticate as any, getMyResumeData as any);
router.post('/upload', authenticate as any, upload.single('resume'), uploadResume as any);
router.post('/build', authenticate as any, buildResumePdf as any);
router.post('/build/latex', authenticate as any, buildLatexPdf as any);



export default router;
