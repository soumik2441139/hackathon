import cron from 'node-cron';
import { startPipeline } from './bot.service';
import BotReport from '../models/BotReport';
import { distillMemories } from './memory/agent.memory';
import { enqueue } from './queue/queue.service';
import { log, logError } from '../utils/logger';

async function safeReportAction(action: string) {
    try {
        await (BotReport as any).logAction('scheduler', 'Scheduler', action, 0);
    } catch (err) {
        // Scheduler telemetry must never crash the API if Mongo is unavailable.
        logError('SCHEDULER', 'Failed to persist action log', err);
    }
}

async function safeReportError(message: string) {
    try {
        await (BotReport as any).logError('scheduler', 'Scheduler', message);
    } catch (err) {
        // Keep runtime stable even when report persistence fails.
        logError('SCHEDULER', 'Failed to persist error log', err);
    }
}

/**
 * Autonomous Bot Scheduler
 * Runs the full bot pipeline automatically on a timer.
 * No admin intervention required.
 */
export function initScheduler() {
    log('SCHEDULER', 'Autonomous bot scheduler initialized.');

    // Run the full pipeline every 6 hours: at 00:00, 06:00, 12:00, 18:00
    cron.schedule('0 */6 * * *', async () => {
        log('SCHEDULER', 'Triggering scheduled pipeline run...');
        try {
            await safeReportAction('⏰ Scheduled pipeline triggered automatically');
            await startPipeline();
            await safeReportAction('✅ Scheduled pipeline completed successfully');
        } catch (err: any) {
            logError('SCHEDULER', `Pipeline failed: ${err.message}`, err);
            await safeReportError(`Pipeline failed: ${err.message}`);
        }
    });
    
    // Antigravity: Trigger outreach sweep every 30 minutes
    cron.schedule('*/30 * * * *', async () => {
        try {
            await enqueue('job-outreach', 'periodic-outreach', {});
        } catch (err) {
            logError('SCHEDULER', 'Outreach trigger failed', err);
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
                log('SCHEDULER', `Cleaned up ${result.deletedCount} old report entries.`);
            }

            // Trigger daily cleanup via BullMQ queue
            await enqueue('cleanup-jobs', 'daily-cleanup', {}, { jobId: `cleanup-${cutoffDate}` });
        } catch (err) {
            logError('SCHEDULER', 'Report cleanup failed', err);
        }
    });

    // Distill agent memories daily at 3 AM — agents learn from their history
    cron.schedule('0 3 * * *', async () => {
        log('SCHEDULER', 'Running memory distillation...');
        try {
            const agents = ['fix-worker', 'supervise-worker', 'scan-worker'];
            for (const agentId of agents) {
                const rules = await distillMemories(agentId);
                if (rules.length > 0) {
                    log('SCHEDULER', `${agentId} learned ${rules.length} new rules`);
                }
            }
        } catch (err) {
            logError('SCHEDULER', 'Memory distillation failed', err);
        }
    });

    // Run the pipeline once immediately on startup (after a 30-second delay to let DB connect)
    setTimeout(async () => {
        log('SCHEDULER', 'Running initial pipeline on startup...');
        try {
            await safeReportAction('🚀 Initial startup pipeline triggered');
            await startPipeline();
            await safeReportAction('✅ Startup pipeline completed');
        } catch (err: any) {
            logError('SCHEDULER', `Initial pipeline failed: ${err.message}`, err);
            await safeReportError(`Startup pipeline failed: ${err.message}`);
        }
    }, 30000);
}
