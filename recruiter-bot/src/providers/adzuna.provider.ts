import axios from 'axios';
import { NormalizedJob } from './remotive.provider';

/**
 * Adzuna Job Provider — Phase 2
 * Fetches internship & junior jobs from Adzuna's API (16+ countries)
 */

const ADZUNA_API = 'https://api.adzuna.com/v1/api/jobs';

const JUNIOR_KEYWORDS = [
    'intern', 'internship', 'junior', 'entry', 'entry-level',
    'graduate', 'fresher', 'trainee', 'associate', 'starter',
    'apprentice', 'beginner', 'jr', 'jr.', 'new grad',
];

function isJuniorJob(title: string, description: string): boolean {
    const text = `${title} ${description}`.toLowerCase();
    return JUNIOR_KEYWORDS.some(kw => text.includes(kw));
}

function mapJobType(contractType: string | undefined, title: string): 'Internship' | 'Full-time' | 'Part-time' | 'Contract' {
    const t = (contractType || '').toLowerCase();
    const titleLower = title.toLowerCase();
    if (titleLower.includes('intern') || t.includes('intern')) return 'Internship';
    if (t.includes('contract')) return 'Contract';
    if (t.includes('part')) return 'Part-time';
    return 'Full-time';
}

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return '1 day ago';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return `${Math.floor(days / 30)} months ago`;
}

function stripHtml(html: string): string {
    return html
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/?[^>]+(>|$)/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .trim();
}

// Countries to search (Adzuna supports these country codes)
const SEARCH_COUNTRIES = ['in', 'gb', 'us'];

// Search queries targeting junior/intern roles
const SEARCH_QUERIES = [
    'internship software',
    'junior developer',
    'entry level engineer',
    'graduate software',
    'fresher developer',
];

export async function fetchAdzunaJobs(): Promise<NormalizedJob[]> {
    const appId = process.env.ADZUNA_APP_ID;
    const apiKey = process.env.ADZUNA_API_KEY;

    if (!appId || !apiKey) {
        console.log('⏭️  [Adzuna] Skipped — no API keys configured');
        return [];
    }

    console.log('🤖 [Adzuna] Fetching jobs...');
    const allJobs: NormalizedJob[] = [];
    const seenIds = new Set<string>();

    for (const country of SEARCH_COUNTRIES) {
        for (const query of SEARCH_QUERIES) {
            try {
                const { data } = await axios.get(`${ADZUNA_API}/${country}/search/1`, {
                    params: {
                        app_id: appId,
                        app_key: apiKey,
                        results_per_page: 20,
                        what: query,
                        max_days_old: 14,
                        sort_by: 'date',
                        content_type: 'application/json',
                    },
                    timeout: 15000,
                });

                const results = data.results || [];
                console.log(`🤖 [Adzuna] ${country}/${query}: ${results.length} results`);

                for (const job of results) {
                    const id = `adzuna_${job.id}`;
                    if (seenIds.has(id)) continue;
                    seenIds.add(id);

                    // Extra filter to ensure it's truly junior
                    if (!isJuniorJob(job.title || '', job.description || '')) continue;

                    const companyName = job.company?.display_name || 'Unknown Company';
                    const location = job.location?.display_name || 'Unknown';
                    const city = job.location?.area?.[job.location.area.length - 1] || location.split(',')[0] || 'Unknown';

                    allJobs.push({
                        title: job.title || 'Untitled',
                        company: companyName,
                        companyLogo: `https://logo.clearbit.com/${companyName.toLowerCase().replace(/\s+/g, '')}.com`,
                        location,
                        city,
                        type: mapJobType(job.contract_type, job.title || ''),
                        mode: (job.title || '').toLowerCase().includes('remote') ? 'Remote' : 'Onsite',
                        salary: job.salary_min && job.salary_max
                            ? `${job.salary_min.toLocaleString()} - ${job.salary_max.toLocaleString()}`
                            : '',
                        description: stripHtml(job.description || '').slice(0, 2000),
                        tags: [job.category?.label || 'Tech'].filter(Boolean),
                        source: 'adzuna' as const,
                        externalId: id,
                        externalUrl: job.redirect_url || '',
                        posted: timeAgo(job.created || new Date().toISOString()),
                    });
                }
            } catch (err: any) {
                // Don't fail the whole batch on one request error
                console.warn(`⚠️ [Adzuna] ${country}/${query} failed: ${err.message}`);
            }
        }
    }

    console.log(`🤖 [Adzuna] Total: ${allJobs.length} junior/intern jobs found`);
    return allJobs;
}
