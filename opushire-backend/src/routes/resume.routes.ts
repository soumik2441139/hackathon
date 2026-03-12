import express from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { uploadResume } from '../controllers/resume.controller';
import upload from '../middleware/uploadResume';

const router = express.Router();

router.post('/upload', authenticate, upload.single('resume'), uploadResume);

export default router;
