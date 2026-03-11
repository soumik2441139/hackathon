import express from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { getMyMatches } from '../controllers/match.controller';

const router = express.Router();

router.get('/my', authenticate, getMyMatches);

export default router;
