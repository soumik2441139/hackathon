import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
export declare const getJobs: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const getJobById: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const createJob: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const updateJob: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const deleteJob: (req: Request, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=job.controller.d.ts.map