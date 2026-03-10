import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import BotReport from '../models/BotReport';

export const getReports = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        if (req.user?.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Forbidden: Admin only' });
        }

        // Get last 7 days of reports, sorted newest first
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const cutoffDate = sevenDaysAgo.toISOString().split('T')[0];

        const reports = await BotReport.find({ date: { $gte: cutoffDate } })
            .sort({ date: -1, botId: 1 })
            .lean();

        // Group by date
        const grouped: Record<string, any[]> = {};
        for (const report of reports) {
            if (!grouped[report.date]) grouped[report.date] = [];
            grouped[report.date].push(report);
        }

        res.json({ success: true, data: grouped });
    } catch (err) {
        next(err);
    }
};

export const getReportByDate = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        if (req.user?.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Forbidden: Admin only' });
        }

        const date = req.params.date;
        const reports = await BotReport.find({ date })
            .sort({ botId: 1 })
            .lean();

        res.json({ success: true, data: reports });
    } catch (err) {
        next(err);
    }
};
