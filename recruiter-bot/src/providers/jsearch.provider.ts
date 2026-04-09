import axios from 'axios';
import { NormalizedJob } from './remotive.provider';

/**
 * JSearch Provider — via RapidAPI (openwebninja/jsearch)
 *
 * Taps Google for Jobs which aggregates:
 *   LinkedIn, Indeed, Glassdoor, ZipRecruiter, Monster, and 1000s more.
 *
 * Free tier: 200 req/month on RapidAPI (Basic plan — no credit card needed)
 * Sign up:   https://rapidapi.com/letscrapeapi-letscrapeapi-default/api/jsearch
 * Env var:   JSEARCH_API_KEY (your RapidAPI key)
 */

const JSEARCH_API = 'https://jsearch.p.rapidapi.com/search';

const SEARCH_QUERIES = [
    'junior software engineer India',
    'software intern India',
    'entry level developer India',
    'graduate software engineer India',
    'junior frontend developer India',
    'junior backend developer India',
    'software trainee India',
    'software developer intern remote',
];

const JUNIOR_KEYWORDS = [
    'intern', 'internship', 'junior', 'entry', 'entry-level',
    'graduate', 'fresher', 'trainee', 'associate', 'jr', 'new grad',
];

function isJuniorJob(title: string, description: string): boolean {
    const text = `${title} ${description}`.toLowerCase();
    return JUNIOR_KEYWORDS.some(kw => text.includes(kw));
}

function mapJobType(title: string, isRemote: boolean): 'Internship' | 'Full-time' | 'Part-time' | 'Contract' {
    const t = title.toLowerCase();
    if (t.includes('intern')) return 'Internship';
    if (t.includes('contract') || t.includes('freelance')) return 'Contract';
    if (t.includes('part')) return 'Part-time';
    return 'Full-time';
}

function timeAgo(dateStr: string | null): string {
    if (!dateStr) return 'Recent';
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return '1 day ago';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return `${Math.floor(days / 30)} months ago`;
}

export async function fetchJSearchJobs(): Promise<NormalizedJob[]> {
    const apiKey = process.env.JSEARCH_API_KEY;
    if (!apiKey) {
        console.log('⏭️  [JSearch] Skipped — JSEARCH_API_KEY not set');
        return [];
    }

    console.log('🤖 [JSearch] Fetching India/Remote junior jobs via Google for Jobs...');
    const allJobs: NormalizedJob[] = [];
    const seenIds = new Set<string>();

    for (const query of SEARCH_QUERIES) {
        try {
            const { data } = await axios.get(JSEARCH_API, {
                params: {
                    query,
                    num_pages: '1',
                    page: '1',
                    date_posted: 'month',  // last 30 days only
                },
                headers: {
                    'x-rapidapi-key': apiKey,
                    'x-rapidapi-host': 'jsearch.p.rapidapi.com',
                },
                timeout: 15000,
            });

            const results: any[] = data?.data || [];
            console.log(`🤖 [JSearch] "${query}": ${results.length} results`);

            for (const job of results) {
                const id = `jsearch_${job.job_id}`;
                if (seenIds.has(id)) continue;
                seenIds.add(id);

                if (!isJuniorJob(job.job_title || '', job.job_description || '')) continue;

                const isRemote = job.job_is_remote === true;
                const city = job.job_city || (isRemote ? 'Remote' : 'Unknown');
                const country = job.job_country || '';
                const location = isRemote ? 'Remote' :
                    [job.job_city, job.job_state, country].filter(Boolean).join(', ');

                const company = job.employer_name || 'Unknown Company';

                allJobs.push({
                    title: job.job_title || 'Untitled',
                    company,
                    companyLogo: job.employer_logo ||
                        `https://unavatar.io/${company.toLowerCase().replace(/\s+/g, '')}.com`,
                    location,
                    city,
                    type: mapJobType(job.job_title || '', isRemote),
                    mode: isRemote ? 'Remote' : (job.job_title?.toLowerCase().includes('hybrid') ? 'Hybrid' : 'Onsite'),
                    salary: job.job_min_salary && job.job_max_salary
                        ? `${job.job_salary_currency || 'USD'} ${job.job_min_salary.toLocaleString()} - ${job.job_max_salary.toLocaleString()}`
                        : '',
                    description: (job.job_description || '').slice(0, 2000),
                    tags: [
                        ...(job.job_required_skills || []),
                        job.job_employment_type,
                        job.job_publisher,
                    ].filter(Boolean).slice(0, 10),
                    source: 'jsearch' as any,
                    externalId: id,
                    externalUrl: job.job_apply_link || job.job_google_link || '',
                    posted: timeAgo(job.job_posted_at_datetime_utc),
                });
            }
        } catch (err: any) {
            const status = err?.response?.status;
            if (status === 429) {
                console.warn('⚠️ [JSearch] Rate limit hit — monthly quota may be exhausted');
                break; // stop further queries if quota gone
            }
            console.warn(`⚠️ [JSearch] Query "${query}" failed: ${err.message}`);
        }
    }

    console.log(`🤖 [JSearch] Total: ${allJobs.length} junior jobs (from ${seenIds.size} raw, via Google for Jobs)`);
    return allJobs;
}
