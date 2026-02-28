import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import * as JobService from '../services/job.service';
import { jobFilterSchema, createJobSchema } from '../services/job.service';

export const getJobs = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const filters = jobFilterSchema.parse(req.query);
        const result = await JobService.getJobs(filters);
        res.json({ success: true, data: result });
    } catch (err) {
        next(err);
    }
};

export const getJobById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const job = await JobService.getJobById(req.params.id as string);
        res.json({ success: true, data: job });
    } catch (err) {
        next(err);
    }
};

export const createJob = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const data = createJobSchema.parse(req.body);
        const job = await JobService.createJob(data, req.user!.id);
        res.status(201).json({ success: true, data: job });
    } catch (err) {
        next(err);
    }
};

export const updateJob = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const job = await JobService.updateJob(req.params.id as string, req.body);
        res.json({ success: true, data: job });
    } catch (err) {
        next(err);
    }
};

export const deleteJob = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await JobService.deleteJob(req.params.id as string);
        res.json({ success: true, data: result });
    } catch (err) {
        next(err);
    }
};
