import { Router } from 'express';
import * as AdminController from '../controllers/admin.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';

const router = Router();

// All routes here require admin privileges
router.use(authenticate, requireRole('admin'));

router.get('/users', AdminController.getAllUsers);
router.delete('/users/:id', AdminController.deleteUser);
router.get('/stats', AdminController.getSystemStats);
router.get('/pending-jobs', AdminController.getPendingJobs);
router.post('/apply-fix/:id', AdminController.resolvePendingJob);
router.get('/debug-db', AdminController.debugDatabase);

export default router;
