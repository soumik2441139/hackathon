import { Router } from 'express';
import * as JobController from '../controllers/job.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';

const router = Router();

// Public
router.get('/', JobController.getJobs);
router.get('/:id', JobController.getJobById);

// Admin and Recruiter
router.post('/', authenticate, requireRole('admin', 'recruiter'), JobController.createJob);
router.put('/:id', authenticate, requireRole('admin', 'recruiter'), JobController.updateJob);
router.delete('/:id', authenticate, requireRole('admin', 'recruiter'), JobController.deleteJob);

export default router;
