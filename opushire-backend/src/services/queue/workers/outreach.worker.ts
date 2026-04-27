import { createWorker } from '../queue.service';
import { JobMatch } from '../../../models/JobMatch';
import { User } from '../../../models/User';
import { TelegramService } from '../../telegram.service';

/**
 * BullMQ worker that finds unsent high-scored job matches and 
 * notifies candidates via Telegram if they have opted-in.
 */
export function registerOutreachWorker() {
    createWorker('job-outreach', async (job: { data?: { candidateId?: string } }) => {
        const targetCandidateId = job.data?.candidateId;
        
        // 1. Find matches with high score >= 85
        const query: any = {
            antigravityScore: { $gte: 85 },
            sentToCandidate:  false,
        };
        
        // If triggered for a specific candidate, focus on them
        if (targetCandidateId) query.candidateId = targetCandidateId;

        const matches = await JobMatch.find(query).limit(20);

        if (matches.length === 0) return { processed: 0, sent: 0 };

        let sentCount = 0;

        for (const match of matches) {
            const user = await User.findById(match.candidateId).select('+telegramChatId outreachEnabled').lean();
            
            // Skip if user hasn't linked Telegram or disabled outreach
            if (!user || !user.telegramChatId || user.outreachEnabled === false) {
                // Mark as processed (even if skipped) so we don't keep polling it
                await JobMatch.findByIdAndUpdate(match._id, { sentToCandidate: true });
                continue;
            }

            const message = TelegramService.formatJobMatch(match);
            const success = await TelegramService.sendMessage(user.telegramChatId, message);

            if (success) {
                sentCount++;
            }

            // Always mark as sent/processed so we don't repeat-spam
            await JobMatch.findByIdAndUpdate(match._id, { sentToCandidate: true });
        }

        console.log(`[Outreach] Processed ${matches.length} matches, sent ${sentCount} notifications`);
        return { processed: matches.length, sent: sentCount };
    });
}
