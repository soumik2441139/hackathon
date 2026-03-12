import { Router } from 'express';
import * as AuthController from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import rateLimit from 'express-rate-limit';

const authLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 10, // Limit each IP to 10 requests per windowMs for auth routes
    message: 'Too many login/register attempts from this IP, please try again after 10 minutes',
});

const router = Router();

// Public
router.post('/register', authLimiter, AuthController.register);
router.post('/login', authLimiter, AuthController.login);
router.post('/verify-email', authLimiter, AuthController.verifyEmail);
router.post('/resend-verification', authLimiter, AuthController.resendVerificationCode);

// Protected
router.get('/me', authenticate, AuthController.getMe);
router.put('/me', authenticate, AuthController.updateProfile);

export default router;
