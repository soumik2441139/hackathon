import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import * as AuthService from '../services/auth.service';
import {
    registerSchema,
    loginSchema,
    verifyEmailSchema,
    resendVerificationSchema,
} from '../services/auth.service';

export const register = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const data = registerSchema.parse(req.body);

        const result = await AuthService.registerUser(data);
        res.status(201).json({ success: true, data: result, message: result.message });
    } catch (err) {
        next(err);
    }
};

export const login = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const data = loginSchema.parse(req.body);
        const result = await AuthService.loginUser(data);
        res.json({ success: true, data: result });
    } catch (err) {
        next(err);
    }
};

export const verifyEmail = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const data = verifyEmailSchema.parse(req.body);
        const result = await AuthService.verifyEmail(data);
        res.json({ success: true, data: result, message: 'Email verified successfully.' });
    } catch (err) {
        next(err);
    }
};

export const resendVerificationCode = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const data = resendVerificationSchema.parse(req.body);
        const result = await AuthService.resendVerificationCode(data);
        res.json({ success: true, data: result, message: result.message });
    } catch (err) {
        next(err);
    }
};

export const getMe = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const user = await AuthService.getProfile(req.user!.id);
        res.json({ success: true, data: user });
    } catch (err) {
        next(err);
    }
};

export const updateProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const user = await AuthService.updateProfile(req.user!.id, req.body);
        res.json({ success: true, data: user });
    } catch (err) {
        next(err);
    }
};
