import { Router } from 'express';
import * as JobController from '../controllers/job.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';

const router = Router();

// Matches (Opus AI Scout)
router.get('/matches/all', authenticate as any, JobController.getScoutMatches as any);


// Public
router.get('/', JobController.getJobs as any);
router.get('/:id', JobController.getJobById as any);






// Admin
router.post('/', authenticate as any, requireRole('admin') as any, JobController.createJob as any);
router.put('/:id', authenticate as any, requireRole('admin') as any, JobController.updateJob as any);
router.delete('/:id', authenticate as any, requireRole('admin') as any, JobController.deleteJob as any);


router.post('/:id/auto-apply', authenticate as any, requireRole('student', 'admin') as any, JobController.autoApply as any);





export default router;
