import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import * as AppService from '../services/application.service';
import { applySchema, updateStatusSchema } from '../services/application.service';

export const apply = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const data = applySchema.parse(req.body);
        const application = await AppService.applyToJob(data, req.user!.id);
        res.status(201).json({ success: true, data: application });
    } catch (err) {
        next(err);
    }
};

export const getMyApplications = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const applications = await AppService.getMyApplications(req.user!.id);
        res.json({ success: true, data: applications });
    } catch (err) {
        next(err);
    }
};

export const getAllApplications = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { jobId } = req.query as { jobId?: string };
        const applications = await AppService.getAllApplications(jobId);
        res.json({ success: true, data: applications });
    } catch (err) {
        next(err);
    }
};

export const updateStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = updateStatusSchema.parse(req.body);
        const application = await AppService.updateApplicationStatus(req.params.id as string, data);
        res.json({ success: true, data: application });
    } catch (err) {
        next(err);
    }
};
