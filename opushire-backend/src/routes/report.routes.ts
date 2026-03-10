import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { getReports, getReportByDate } from '../controllers/report.controller';

const router = Router();

router.get('/', authenticate, getReports);
router.get('/:date', authenticate, getReportByDate);

export default router;
