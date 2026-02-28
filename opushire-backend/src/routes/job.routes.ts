import { Router } from 'express';
import * as JobController from '../controllers/job.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';

const router = Router();

// Public
router.get('/', JobController.getJobs);
router.get('/:id', JobController.getJobById);

// Admin only
router.post('/', authenticate, requireRole('admin'), JobController.createJob);
router.put('/:id', authenticate, requireRole('admin'), JobController.updateJob);
router.delete('/:id', authenticate, requireRole('admin'), JobController.deleteJob);

export default router;
