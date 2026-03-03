import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import * as BotService from '../services/bot.service';

export const getBotStatuses = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        if (req.user?.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Forbidden: Admin only' });
        }
        const statuses = BotService.getAllBotStatuses();
        res.json({ success: true, data: statuses });
    } catch (err) {
        next(err);
    }
};

export const startBot = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        if (req.user?.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Forbidden: Admin only' });
        }
        const id = req.params.id as string;
        const status = BotService.startBot(id);
        res.json({ success: true, data: status });
    } catch (err) {
        next(err);
    }
};

export const stopBot = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        if (req.user?.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Forbidden: Admin only' });
        }
        const id = req.params.id as string;
        const status = BotService.stopBot(id);
        res.json({ success: true, data: status });
    } catch (err) {
        next(err);
    }
};

export const getBotLogs = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        if (req.user?.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Forbidden: Admin only' });
        }
        const id = req.params.id as string;
        const logs = BotService.getBotLogs(id);
        res.json({ success: true, data: logs });
    } catch (err) {
        next(err);
    }
};
