import { Request, Response, NextFunction } from 'express';
import * as AdminService from '../services/admin.service';

export const getAllUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const role = typeof req.query.role === 'string' ? req.query.role : undefined;
        const users = await AdminService.getAllUsers(role);
        res.json({ success: true, data: users });
    } catch (err) {
        next(err);
    }
};

export const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await AdminService.deleteUser(req.params.id);
        res.json({ success: true, data: result });
    } catch (err) {
        next(err);
    }
};

export const getSystemStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const stats = await AdminService.getSystemStats();
        res.json({ success: true, data: stats });
    } catch (err) {
        next(err);
    }
};
