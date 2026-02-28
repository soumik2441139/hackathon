import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
export declare const apply: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getMyApplications: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getAllApplications: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const updateStatus: (req: Request, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=application.controller.d.ts.map