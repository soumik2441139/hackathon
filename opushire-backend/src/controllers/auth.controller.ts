import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import * as AuthService from '../services/auth.service';
import { registerSchema, loginSchema } from '../services/auth.service';
import { imageToBase64 } from '../services/image.service';

export const register = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const data = registerSchema.parse(req.body);

        // If recruiter, convert logo URL to Base64 to ensure it's stored in DB
        if (data.role === 'recruiter' && data.companyLogo) {
            data.companyLogo = await imageToBase64(data.companyLogo);
        }

        const result = await AuthService.registerUser(data);
        res.status(201).json({ success: true, data: result });
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
        const body = { ...req.body };
        // If updating logo, convert to Base64
        if (body.companyLogo && !body.companyLogo.startsWith('data:')) {
            body.companyLogo = await imageToBase64(body.companyLogo);
        }

        const user = await AuthService.updateProfile(req.user!.id, body);
        res.json({ success: true, data: user });
    } catch (err) {
        next(err);
    }
};
