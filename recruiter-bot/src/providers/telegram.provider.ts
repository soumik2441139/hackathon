import axios from 'axios';
import { NormalizedJob } from './remotive.provider';

/**
 * Telegram Public Channel Provider — Phase 3
 *
 * Reads public Telegram channel web previews (t.me/s/channel_name)
 * WITHOUT joining. Completely invisible to channel admins.
 *
 * Parses job posts using keyword matching and regex patterns.
 */

// Popular public job channels — add more as needed
const DEFAULT_CHANNELS = [
    'internshala_jobs',
    'freshabordjobs',
    'jobs_and_internships',
    'remote_jobs_feed',
    'workintech',
];

const JUNIOR_KEYWORDS = [
    'intern', 'internship', 'junior', 'entry', 'entry-level',
    'graduate', 'fresher', 'trainee', 'associate',
    'apprentice', 'beginner', 'new grad', '0-1 year',
    '0 - 1 year', 'no experience', 'freshers',
];

const JOB_TITLE_PATTERNS = [
    /(?:hiring|opening|vacancy|role|position|job|opportunity)[:\s-]*(.+?)(?:\n|$)/i,
    /(?:🔹|🔸|💼|🎯|📌)\s*(.+?)(?:\n|$)/i,
    /^(?:title|role|position)[:\s-]*(.+?)$/im,
];

const COMPANY_PATTERNS = [
    /(?:company|org|organization|at)\s*[:\-–]\s*(.+?)(?:\n|$)/i,
    /(?:🏢|🏛️)\s*(.+?)(?:\n|$)/i,
    /^(?:company)\s*[:\-]\s*(.+?)$/im,
];

const LOCATION_PATTERNS = [
    /(?:location|place|city)\s*[:\-–]\s*(.+?)(?:\n|$)/i,
    /(?:📍|🌍)\s*(.+?)(?:\n|$)/i,
    /\b(remote|work from home|wfh|hybrid|onsite|on-site|bangalore|mumbai|delhi|hyderabad|pune|chennai|kolkata|noida|gurgaon|gurugram)\b/i,
];

const APPLY_LINK_PATTERN = /(?:apply|link|form)\s*[:\-–]?\s*(https?:\/\/[^\s<>"]+)/i;
const URL_PATTERN = /(https?:\/\/[^\s<>"]+)/;

function isJobPost(text: string): boolean {
    const lower = text.toLowerCase();
    const hasJobWord = ['hiring', 'opening', 'vacancy', 'job', 'intern', 'position', 'apply', 'opportunity', 'role'].some(w => lower.includes(w));
    const hasJuniorWord = JUNIOR_KEYWORDS.some(kw => lower.includes(kw));
    return hasJobWord && hasJuniorWord;
}

function extractField(text: string, patterns: RegExp[]): string | null {
    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match && match[1]) return match[1].trim();
    }
    return null;
}

function determineMode(text: string): 'Remote' | 'Hybrid' | 'Onsite' {
    const lower = text.toLowerCase();
    if (lower.includes('remote') || lower.includes('wfh') || lower.includes('work from home')) return 'Remote';
    if (lower.includes('hybrid')) return 'Hybrid';
    return 'Onsite';
}

function determineType(text: string): 'Internship' | 'Full-time' | 'Part-time' | 'Contract' {
    const lower = text.toLowerCase();
    if (lower.includes('intern')) return 'Internship';
    if (lower.includes('contract') || lower.includes('freelance')) return 'Contract';
    if (lower.includes('part time') || lower.includes('part-time')) return 'Part-time';
    return 'Full-time';
}

function stripHtml(html: string): string {
    return html
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/?[^>]+(>|$)/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

async function fetchChannelPosts(channelName: string): Promise<string[]> {
    try {
        const url = `https://t.me/s/${channelName}`;
        const { data: html } = await axios.get(url, {
            timeout: 15000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
        });

        // Extract message text blocks from the HTML
        const messageRegex = /<div class="tgme_widget_message_text[^"]*"[^>]*>([\s\S]*?)<\/div>/g;
        const posts: string[] = [];
        let match;

        while ((match = messageRegex.exec(html)) !== null) {
            const text = stripHtml(match[1]);
            if (text.length > 50) posts.push(text); // Skip very short messages
        }

        return posts;
    } catch (err: any) {
        console.warn(`⚠️ [Telegram] Failed to fetch @${channelName}: ${err.message}`);
        return [];
    }
}

export async function fetchTelegramJobs(): Promise<NormalizedJob[]> {
    const channelsEnv = process.env.TELEGRAM_CHANNELS;
    const channels = channelsEnv
        ? channelsEnv.split(',').map(c => c.trim())
        : DEFAULT_CHANNELS;

    console.log(`🤖 [Telegram] Scanning ${channels.length} channels: ${channels.join(', ')}`);

    const allJobs: NormalizedJob[] = [];
    const seenHashes = new Set<string>();

    for (const channel of channels) {
        const posts = await fetchChannelPosts(channel);
        console.log(`🤖 [Telegram] @${channel}: ${posts.length} posts found`);

        for (const post of posts) {
            if (!isJobPost(post)) continue;

            // Create a simple hash for deduplication
            const hash = `telegram_${channel}_${Buffer.from(post.slice(0, 100)).toString('base64').slice(0, 20)}`;
            if (seenHashes.has(hash)) continue;
            seenHashes.add(hash);

            const title = extractField(post, JOB_TITLE_PATTERNS) || post.split('\n')[0].slice(0, 80);
            const company = extractField(post, COMPANY_PATTERNS) || 'Via Telegram';
            const locationText = extractField(post, LOCATION_PATTERNS) || '';
            const applyLink = post.match(APPLY_LINK_PATTERN)?.[1] || post.match(URL_PATTERN)?.[1] || `https://t.me/s/${channel}`;

            allJobs.push({
                title: title.slice(0, 100),
                company,
                companyLogo: company !== 'Via Telegram'
                    ? `https://logo.clearbit.com/${company.toLowerCase().replace(/\s+/g, '')}.com`
                    : '🤖',
                location: locationText || 'See Description',
                city: locationText?.split(',')[0]?.trim() || 'Unknown',
                type: determineType(post),
                mode: determineMode(post),
                salary: '',
                description: post.slice(0, 2000),
                tags: ['telegram', channel],
                source: 'telegram' as const,
                externalId: hash,
                externalUrl: applyLink,
                posted: 'Recent',
            });
        }
    }

    console.log(`🤖 [Telegram] Total: ${allJobs.length} junior/intern job posts extracted`);
    return allJobs;
}
