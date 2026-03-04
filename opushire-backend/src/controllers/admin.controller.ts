import { Request, Response, NextFunction } from 'express';
import * as AdminService from '../services/admin.service';
import { autoFixJobWithAI } from '../services/ai-extractor.service';

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
        const result = await AdminService.deleteUser(req.params.id as string);
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

export const getPendingJobs = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const jobs = await AdminService.getPendingJobs();
        res.json({ success: true, data: jobs });
    } catch (err) {
        next(err);
    }
};

export const resolvePendingJob = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { action } = req.body;
        if (action !== 'approve' && action !== 'reject') {
            return res.status(400).json({ success: false, message: 'Invalid action. Must be approve or reject.' });
        }
        const result = await AdminService.resolvePendingJob(req.params.id as string, action);
        res.json({ success: true, data: result });
    } catch (err) {
        next(err);
    }
};

export const debugDatabase = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const force = req.query.force === 'true';
        const debugInfo = await AdminService.debugDatabase(force);
        res.json({ success: true, data: debugInfo });
    } catch (err) {
        next(err);
    }
};

export const autoFixJob = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await autoFixJobWithAI(req.params.id as string);
        res.json({ success: true, data: result });
    } catch (err) {
        next(err);
    }
};
