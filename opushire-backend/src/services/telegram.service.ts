import axios from 'axios';
import { env } from '../config/env';
import { log, logError } from '../utils/logger';

export class TelegramService {
    private static botToken = env.TELEGRAM_BOT_TOKEN;

    /**
     * Sends a markdown-formatted message to a specific Telegram chat.
     * Fails silently if token or chatId is missing.
     */
    static async sendMessage(chatId: string, message: string): Promise<boolean> {
        if (!this.botToken || !chatId) {
            log('TELEGRAM', 'Skipping send — missing BOT_TOKEN or chatId');
            return false;
        }

        try {
            const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;
            await axios.post(url, {
                chat_id: chatId,
                text: message,
                parse_mode: 'Markdown',
                disable_web_page_preview: false,
            }, { timeout: 10000 });

            log('TELEGRAM', `Message sent to ${chatId}`);
            return true;
        } catch (err: any) {
            logError('TELEGRAM', `Error sending message: ${err.response?.data?.description || err.message}`, err);
            return false;
        }
    }

    /**
     * Formats a JobMatch for a Telegram notification.
     */
    static formatJobMatch(match: any): string {
        const score = match.antigravityScore;
        const emoji = score >= 90 ? '🔥' : '⭐';

        return `
${emoji} *OPUSHIRE — TOP MATCH FOUND!* ${emoji}

*Role:* ${match.jobTitle}
*Company:* ${match.company}
*Target Location:* ${match.location || 'Remote'}
*Antigravity Match Score:* \`${score}/100\`

*Matched Skills:* ${match.matchedSkills.length > 0 ? match.matchedSkills.join(', ') : 'Profile overlap detected'}
${match.missingSkills.length > 0 ? `*Gap:* Consider learning: ${match.missingSkills.slice(0, 3).join(', ')}` : ''}

[🚀 APPLY NOW](${match.applyUrl})

---
_Sent via Antigravity Autonomous Recruiter Agent_
        `.trim();
    }
}
