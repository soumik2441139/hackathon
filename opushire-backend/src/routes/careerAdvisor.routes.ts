import express from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { getCareerInsights } from '../controllers/careerAdvisor.controller';

const router = express.Router();

router.get('/my', authenticate, getCareerInsights);

export default router;
