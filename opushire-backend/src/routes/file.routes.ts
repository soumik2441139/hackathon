import express from 'express';
import { getMyResume } from '../controllers/file.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = express.Router();

// Strict Authentication Gatekeeping over Azure CDN link generators
router.get('/my-resume', authenticate as any, getMyResume as any);


export default router;
