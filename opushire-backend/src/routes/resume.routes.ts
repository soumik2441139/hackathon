import express from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { uploadResume, buildResumePdf } from '../controllers/resume.controller';
import upload from '../middleware/uploadResume';

const router = express.Router();

router.post('/upload', authenticate, upload.single('resume'), uploadResume);
router.post('/build', authenticate, buildResumePdf);

export default router;
