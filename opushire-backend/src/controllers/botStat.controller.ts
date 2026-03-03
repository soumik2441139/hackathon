import { Request, Response } from 'express';
import BotStat from '../models/BotStat';

// GET /api/bots/stats/today
export const getTodayStats = async (req: Request, res: Response) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        let stat = await BotStat.findOne({ date: today });

        // If no stats exist for today yet, return a clean object with 0s
        if (!stat) {
            stat = {
                date: today,
                jobsAdded: 0,
                anomaliesFound: 0,
                fixesMade: 0,
                hallucinationsCaught: 0,
                approvals: 0,
                jobsArchived: 0
            } as any;
        }

        res.status(200).json({ success: true, data: stat });
    } catch (error: any) {
        console.error('Error fetching bot stats:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
