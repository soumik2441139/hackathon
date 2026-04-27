import { Request, Response } from 'express';
import BotStat from '../models/BotStat';
import { logError } from '../utils/logger';

// GET /api/bots/stats/today
export const getTodayStats = async (req: Request, res: Response) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        let stat = await BotStat.findOne({ date: today });

        // If no stats exist for today yet, return a clean object with 0s
        if (!stat) {
            const defaults = {
                date: today,
                jobsAdded: 0,
                anomaliesFound: 0,
                fixesMade: 0,
                hallucinationsCaught: 0,
                approvals: 0,
                jobsArchived: 0,
                resumesMatched: 0,
                advisoriesGenerated: 0,
                profilesEnriched: 0,
                ghostJobsRemoved: 0,
                jobMatchesSaved: 0,
            };
            res.status(200).json({ success: true, data: defaults });
            return;
        }

        res.status(200).json({ success: true, data: stat });
    } catch (error: any) {
        logError('BOT_STATS', 'Error fetching bot stats', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

