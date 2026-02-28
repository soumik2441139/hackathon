import { Router } from 'express';
import * as AppController from '../controllers/application.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';

const router = Router();

// Student: apply to a job
router.post('/', authenticate, requireRole('student'), AppController.apply);

// Student: get own applications
router.get('/my', authenticate, requireRole('student'), AppController.getMyApplications);

// Admin: get all applications (optionally filtered by jobId)
router.get('/', authenticate, requireRole('admin'), AppController.getAllApplications);

// Admin: update application status
router.put('/:id/status', authenticate, requireRole('admin'), AppController.updateStatus);

export default router;
