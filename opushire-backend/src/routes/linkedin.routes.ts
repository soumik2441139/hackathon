import express from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { enrichLinkedIn } from '../controllers/linkedin.controller';

const router = express.Router();

router.post('/enrich', authenticate, enrichLinkedIn);

export default router;
