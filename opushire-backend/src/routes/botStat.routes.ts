import express from 'express';
import { getTodayStats } from '../controllers/botStat.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = express.Router();

// Only admins can view bot telemetry/analytics
router.get('/today', authenticate, (req: any, res, next) => {
    if (req.user?.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Admin access required' });
    }
    next();
}, getTodayStats);

export default router;
