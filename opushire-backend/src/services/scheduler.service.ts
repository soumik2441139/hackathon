import cron from 'node-cron';
import { startPipeline, BOTS } from './bot.service';
import BotReport from '../models/BotReport';

/**
 * Autonomous Bot Scheduler
 * Runs the full bot pipeline automatically on a timer.
 * No admin intervention required.
 */
export function initScheduler() {
    console.log('⏰ [Scheduler] Autonomous bot scheduler initialized.');

    // Run the full pipeline every 6 hours: at 00:00, 06:00, 12:00, 18:00
    cron.schedule('0 */6 * * *', async () => {
        console.log('⏰ [Scheduler] Triggering scheduled pipeline run...');
        try {
            await (BotReport as any).logAction(
                'scheduler', 'Scheduler',
                '⏰ Scheduled pipeline triggered automatically', 0
            );
            await startPipeline();
            await (BotReport as any).logAction(
                'scheduler', 'Scheduler',
                '✅ Scheduled pipeline completed successfully', 0
            );
        } catch (err: any) {
            console.error('⏰ [Scheduler] Pipeline failed:', err.message);
            await (BotReport as any).logError(
                'scheduler', 'Scheduler',
                `Pipeline failed: ${err.message}`
            );
        }
    });

    // Cleanup old reports every day at midnight
    cron.schedule('0 0 * * *', async () => {
        try {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            const cutoffDate = sevenDaysAgo.toISOString().split('T')[0];

            const result = await BotReport.deleteMany({ date: { $lt: cutoffDate } });
            if (result.deletedCount > 0) {
                console.log(`🧹 [Scheduler] Cleaned up ${result.deletedCount} old report entries.`);
            }
        } catch (err) {
            console.error('🧹 [Scheduler] Report cleanup failed:', err);
        }
    });

    // Run the pipeline once immediately on startup (after a 30-second delay to let DB connect)
    setTimeout(async () => {
        console.log('⏰ [Scheduler] Running initial pipeline on startup...');
        try {
            await (BotReport as any).logAction(
                'scheduler', 'Scheduler',
                '🚀 Initial startup pipeline triggered', 0
            );
            await startPipeline();
            await (BotReport as any).logAction(
                'scheduler', 'Scheduler',
                '✅ Startup pipeline completed', 0
            );
        } catch (err: any) {
            console.error('⏰ [Scheduler] Initial pipeline failed:', err.message);
            await (BotReport as any).logError(
                'scheduler', 'Scheduler',
                `Startup pipeline failed: ${err.message}`
            );
        }
    }, 30000);
}
