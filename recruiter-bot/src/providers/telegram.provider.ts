import axios from 'axios';
import { NormalizedJob } from './remotive.provider';
import { scrapeCareerPage } from './page-scraper';

/**
 * Telegram Public Channel Provider — Phase 3 (v2 - Smart Parsing)
 *
 * Reads public Telegram channel web previews (t.me/s/channel_name)
 * WITHOUT joining. Completely invisible to channel admins.
 *
 * Extracts: Company Name, Role Title, Location, Graduation Year, Apply Link
 */

const DEFAULT_CHANNELS = [
    'getjobss', 'jobwithmayra', 'switzerlanddevjobs', 'germantechjobs',
    'cryptojobslist', 'jobs_and_internships_updates', 'thinkcareers',
    'jobhuntcamp', 'internfreak', 'offcampusjobsandinternships', 'gocareers',
    'internshala_jobs', 'freshabordjobs', 'jobs_and_internships',
    'remote_jobs_feed', 'workintech',
];

const JUNIOR_KEYWORDS = [
    'intern', 'internship', 'junior', 'entry', 'entry-level',
    'graduate', 'fresher', 'trainee', 'associate',
    'apprentice', 'beginner', 'new grad', '0-1 year',
    '0 - 1 year', 'no experience', 'freshers', 'hiring',
];

// ─── Smart Extractors ─────────────────────────────────────────────────────────

function extractCompany(text: string): string {
    // Pattern: "Company is hiring..." or "Company Is Hiring For..."
    const hiringMatch = text.match(/^([A-Z][A-Za-z0-9.\-&\s]{1,40}?)\s+(?:is\s+)?hiring/im);
    if (hiringMatch) return hiringMatch[1].trim();

    // Pattern: "Company: XYZ" or "🏢 XYZ"
    const labelMatch = text.match(/(?:company|org|organization)\s*[:\-–]\s*(.+?)(?:\n|$)/i);
    if (labelMatch) return labelMatch[1].trim();

    const emojiMatch = text.match(/🏢\s*(.+?)(?:\n|$)/);
    if (emojiMatch) return emojiMatch[1].trim();

    // Pattern: "at CompanyName" in context
    const atMatch = text.match(/(?:role\s+at|position\s+at|opening\s+at|join)\s+([A-Z][A-Za-z0-9.\-&\s]{1,40}?)(?:\n|[,.|!])/i);
    if (atMatch) return atMatch[1].trim();

    return '';
}

function extractTitle(text: string, company: string): string {
    let title = '';

    // Pattern: "Hiring for SDE Intern" → extract "SDE Intern"
    const forMatch = text.match(/hiring\s+for\s+(.+?)(?:\s+role|\s+position|\n|graduation|location|$)/i);
    if (forMatch) title = forMatch[1].trim();

    // Pattern: "Hiring SDE Intern" (without "for")
    if (!title) {
        const hiringMatch = text.match(/hiring\s+(?:a\s+)?(.+?)(?:\s+role|\s+position|\n|graduation|location|$)/i);
        if (hiringMatch) title = hiringMatch[1].trim();
    }

    // Pattern: Title/Role/Position: XYZ
    if (!title) {
        const labelMatch = text.match(/(?:title|role|position|opening)\s*[:\-–]\s*(.+?)(?:\n|$)/i);
        if (labelMatch) title = labelMatch[1].trim();
    }

    // Pattern: 🔹 Title or 💼 Title
    if (!title) {
        const emojiMatch = text.match(/(?:🔹|🔸|💼|🎯|📌)\s*(.+?)(?:\n|$)/);
        if (emojiMatch) title = emojiMatch[1].trim();
    }

    // Fallback: First line
    if (!title) {
        title = text.split('\n')[0].slice(0, 80);
    }

    // Clean the title
    title = title
        .replace(/^(?:for\s+)/i, '')           // Remove leading "For "
        .replace(/\s+role$/i, '')               // Remove trailing " Role"
        .replace(/\s+position$/i, '')           // Remove trailing " Position"
        .replace(/\s+opening$/i, '')            // Remove trailing " Opening"
        .replace(/^(?:hiring|opening|vacancy)[:\s-]*/i, '') // Remove "Hiring:" prefix
        .trim();

    // Remove company name from title if it's there
    if (company && title.toLowerCase().startsWith(company.toLowerCase())) {
        title = title.slice(company.length).replace(/^[\s\-–:]+/, '').trim();
    }

    return title || 'Software Role';
}

function extractLocation(text: string): { location: string; city: string; mode: 'Remote' | 'Hybrid' | 'Onsite' } {
    const lower = text.toLowerCase();

    // Detect mode first
    let mode: 'Remote' | 'Hybrid' | 'Onsite' = 'Onsite';
    if (lower.includes('remote') || lower.includes('wfh') || lower.includes('work from home')) mode = 'Remote';
    else if (lower.includes('hybrid')) mode = 'Hybrid';

    // Extract explicit location
    const locMatch = text.match(/(?:location|place|city|📍)\s*[:\-–]?\s*(.+?)(?:\n|$)/i);
    if (locMatch) {
        const loc = locMatch[1].trim().replace(/[.,]+$/, '');
        return { location: loc, city: loc.split(',')[0]?.trim() || loc, mode };
    }

    // Known Indian cities
    const cities = [
        'Bangalore', 'Bengaluru', 'Mumbai', 'Delhi', 'Hyderabad', 'Pune', 'Chennai',
        'Kolkata', 'Noida', 'Gurgaon', 'Gurugram', 'Ahmedabad', 'Jaipur', 'Lucknow',
        'Chandigarh', 'Indore', 'Kochi', 'Coimbatore', 'Bhubaneswar',
    ];
    for (const city of cities) {
        if (lower.includes(city.toLowerCase())) {
            return { location: city + ', India', city, mode: mode === 'Remote' ? 'Remote' : mode };
        }
    }

    // International locations
    const intlCities = ['Zurich', 'Berlin', 'London', 'New York', 'San Francisco', 'Singapore', 'Dubai', 'Toronto'];
    for (const city of intlCities) {
        if (lower.includes(city.toLowerCase())) {
            return { location: city, city, mode };
        }
    }

    if (mode === 'Remote') return { location: 'Remote', city: 'Remote', mode };
    return { location: 'India', city: 'India', mode };
}

function extractGradYear(text: string): string {
    const match = text.match(/(?:graduation\s*(?:year)?|batch|passing\s*(?:year|out)?)\s*[:\-–]?\s*([\d,\s/&]+(?:\d{4}))/i);
    if (match) return match[1].trim();

    // Pattern: "2024, 2025 grads" or "For 2024, 2025"
    const yearMatch = text.match(/(?:for\s+)?(\d{4}(?:\s*[,&/]\s*\d{4})*)\s*(?:grad|batch|pass)/i);
    if (yearMatch) return yearMatch[1].trim();

    return '';
}

function extractApplyLink(text: string): string {
    // Priority: explicit apply link
    const applyMatch = text.match(/(?:apply|link|form|register)\s*(?:here|now|link)?\s*[:\-–]?\s*(https?:\/\/[^\s<>"]+)/i);
    if (applyMatch) return applyMatch[1].replace(/[.,)]+$/, '');

    // Fallback: any URL
    const urlMatch = text.match(/(https?:\/\/[^\s<>"]+)/);
    if (urlMatch) return urlMatch[1].replace(/[.,)]+$/, '');

    return '';
}

function extractSalary(text: string): string {
    const match = text.match(/(?:salary|stipend|ctc|package|compensation)\s*[:\-–]?\s*(.+?)(?:\n|$)/i);
    if (match) return match[1].trim().slice(0, 60);

    // Pattern: ₹XX,XXX or $XX,XXX or XX LPA
    const numMatch = text.match(/((?:₹|Rs\.?|\$|INR)\s*[\d,]+(?:\s*[-–to]+\s*(?:₹|Rs\.?|\$|INR)?\s*[\d,]+)?(?:\s*(?:per\s+month|p\.m\.|pm|lpa|per\s+annum))?)/i);
    if (numMatch) return numMatch[1].trim();

    return '';
}

function isJobPost(text: string): boolean {
    const lower = text.toLowerCase();
    const hasJobWord = ['hiring', 'opening', 'vacancy', 'job', 'intern', 'position', 'apply', 'opportunity', 'role'].some(w => lower.includes(w));
    const hasJuniorWord = JUNIOR_KEYWORDS.some(kw => lower.includes(kw));
    return hasJobWord && hasJuniorWord && text.length > 50;
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

function buildDescription(text: string, company: string, gradYear: string, applyLink: string): string {
    // Build a clean description without the raw dump
    let desc = '';

    // Remove URLs from the description text
    const cleanText = text.replace(/(https?:\/\/[^\s<>"]+)/g, '').trim();

    // Find the main content (skip the first line which is usually "X is hiring...")
    const lines = cleanText.split('\n').filter(l => l.trim());
    const contentLines = lines.slice(1).filter(l => {
        const lower = l.toLowerCase().trim();
        // Skip lines that are just metadata we already extracted
        return !lower.startsWith('company') &&
            !lower.startsWith('location') &&
            !lower.startsWith('apply') &&
            !lower.startsWith('link') &&
            l.trim().length > 5;
    });

    if (contentLines.length > 0) {
        desc = contentLines.join('\n').slice(0, 1500);
    } else {
        desc = `${company} is looking for candidates for this role.`;
    }

    if (gradYear) desc += `\n\nEligible graduation years: ${gradYear}`;

    return desc;
}

// ─── Channel Fetcher ──────────────────────────────────────────────────────────

async function fetchChannelPosts(channelName: string): Promise<string[]> {
    try {
        const url = `https://t.me/s/${channelName}`;
        const { data: html } = await axios.get(url, {
            timeout: 15000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
        });

        const messageRegex = /<div class="tgme_widget_message_text[^"]*"[^>]*>([\s\S]*?)<\/div>/g;
        const posts: string[] = [];
        let match;

        while ((match = messageRegex.exec(html)) !== null) {
            const text = stripHtml(match[1]);
            if (text.length > 50) posts.push(text);
        }

        return posts;
    } catch (err: any) {
        console.warn(`⚠️ [Telegram] Failed to fetch @${channelName}: ${err.message}`);
        return [];
    }
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export async function fetchTelegramJobs(): Promise<NormalizedJob[]> {
    const channelsEnv = process.env.TELEGRAM_CHANNELS;
    const channels = channelsEnv
        ? channelsEnv.split(',').map(c => c.trim())
        : DEFAULT_CHANNELS;

    console.log(`🤖 [Telegram] Scanning ${channels.length} channels...`);

    const allJobs: NormalizedJob[] = [];
    const seenHashes = new Set<string>();

    for (const channel of channels) {
        const posts = await fetchChannelPosts(channel);
        console.log(`🤖 [Telegram] @${channel}: ${posts.length} posts`);

        for (const post of posts) {
            if (!isJobPost(post)) continue;

            const hash = `telegram_${channel}_${Buffer.from(post.slice(0, 100)).toString('base64').slice(0, 20)}`;
            if (seenHashes.has(hash)) continue;
            seenHashes.add(hash);

            const company = extractCompany(post) || channel.replace(/_/g, ' ');
            const title = extractTitle(post, company);
            const { location, city, mode } = extractLocation(post);
            const gradYear = extractGradYear(post);
            const applyLink = extractApplyLink(post);
            const salary = extractSalary(post);
            const description = buildDescription(post, company, gradYear, applyLink);

            // Try to scrape the career page for skills
            let tags: string[] = [];
            if (applyLink && !applyLink.includes('t.me')) {
                try {
                    const pageData = await scrapeCareerPage(applyLink);
                    if (pageData.skills.length > 0) {
                        tags = pageData.skills;
                    }
                } catch {
                    // Silent fail
                }
            }

            const companyClean = company.replace(/\s+/g, '').toLowerCase();

            allJobs.push({
                title,
                company,
                companyLogo: `https://logo.clearbit.com/${companyClean}.com`,
                location,
                city,
                type: title.toLowerCase().includes('intern') ? 'Internship' : 'Full-time',
                mode,
                salary,
                description,
                tags,
                source: 'telegram' as const,
                externalId: hash,
                externalUrl: applyLink || `https://t.me/s/${channel}`,
                posted: 'Recent',
            });
        }
    }

    console.log(`🤖 [Telegram] Total: ${allJobs.length} jobs extracted`);
    return allJobs;
}
