import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import * as botController from '../controllers/bot.controller';

const router = Router();

router.use(authenticate); // Require authentication for all bot routes

router.get('/', botController.getBotStatuses);
router.post('/:id/start', botController.startBot);
router.post('/:id/stop', botController.stopBot);
router.get('/:id/logs', botController.getBotLogs);

export default router;
