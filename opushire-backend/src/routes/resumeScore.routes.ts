import express from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { getMyResumeScore } from '../controllers/resumeScore.controller';

const router = express.Router();

router.get('/my', authenticate, getMyResumeScore);

export default router;
