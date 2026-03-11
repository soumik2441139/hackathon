import express from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/auth.middleware';
import { uploadResume } from '../controllers/resume.controller';

const router = express.Router();
// Use multer for PDF parsing. Saving to a temporary 'uploads/' directory.
const upload = multer({ dest: 'uploads/' });

router.post('/upload', authenticate, upload.single('resume'), uploadResume);

export default router;
