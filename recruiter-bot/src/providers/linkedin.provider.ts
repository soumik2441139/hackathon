import axios from 'axios';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { NormalizedJob } from './remotive.provider';

/**
 * LinkedIn Job Search Provider — via RapidAPI
 * Host:     linkedin-job-search-api.p.rapidapi.com
 * Endpoint: /active-jb-24h  (jobs posted in last 24h)
 *
 * Free Plan Limits:
 *   - 25 requests / month  (HARD LIMIT — ~1/day)
 *   - 100 jobs per request
 *   - 250 jobs / month total
 *
 * Strategy: Make at most 2 targeted queries per run.
 *           Cache results for 23h to survive multiple daily bot restarts.
 *
 * Env var: JSEARCH_API_KEY (same RapidAPI key — linked to your account)
 */

const LINKEDIN_API_HOST = 'linkedin-job-search-api.p.rapidapi.com';
const LINKEDIN_API_BASE = `https://${LINKEDIN_API_HOST}/active-jb-24h`;
const CACHE_FILE = path.join(os.tmpdir(), 'linkedin_jobs_cache.json');
const CACHE_TTL_MS = 23 * 60 * 60 * 1000; // 23 hours

// Only 2 queries per run to stay under the 25 req/month hard limit
const QUERIES = [
    {
        title_filter: '"junior" OR "intern" OR "entry level" OR "graduate" OR "fresher" OR "trainee"',
        location_filter: '"India" OR "Bengaluru" OR "Hyderabad" OR "Pune" OR "Mumbai" OR "Delhi"',
    },
    {
        title_filter: '"junior" OR "intern" OR "entry level" OR "graduate"',
        location_filter: '"Remote"',
    },
];

const JUNIOR_KEYWORDS = [
    'intern', 'internship', 'junior', 'entry', 'entry-level',
    'graduate', 'fresher', 'trainee', 'associate', 'jr', 'new grad',
];

function isJuniorJob(title: string, description: string): boolean {
    const text = `${title} ${description}`.toLowerCase();
    return JUNIOR_KEYWORDS.some(kw => text.includes(kw));
}

function mapJobType(title: string): 'Internship' | 'Full-time' | 'Part-time' | 'Contract' {
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
    return `${Math.floor(days / 7)} weeks ago`;
}

// ─── Cache helpers ────────────────────────────────────────────────────────────

function readCache(): { data: NormalizedJob[]; timestamp: number } | null {
    try {
        if (fs.existsSync(CACHE_FILE)) {
            const raw = fs.readFileSync(CACHE_FILE, 'utf8');
            return JSON.parse(raw);
        }
    } catch { /* ignore */ }
    return null;
}

function writeCache(jobs: NormalizedJob[]): void {
    try {
        fs.writeFileSync(CACHE_FILE, JSON.stringify({ data: jobs, timestamp: Date.now() }), 'utf8');
        console.log(`💾 [LinkedIn] Cache written — ${jobs.length} jobs`);
    } catch { /* ignore */ }
}

// ─── Main fetch ───────────────────────────────────────────────────────────────

export async function fetchLinkedInJobs(): Promise<NormalizedJob[]> {
    const apiKey = process.env.JSEARCH_API_KEY; // Same RapidAPI key
    if (!apiKey) {
        console.log('⏭️  [LinkedIn] Skipped — JSEARCH_API_KEY not set');
        return [];
    }

    // --- Check cache first to preserve monthly quota ---
    const cached = readCache();
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
        const ageHrs = ((Date.now() - cached.timestamp) / 3_600_000).toFixed(1);
        console.log(`💾 [LinkedIn] Cache HIT (${ageHrs}h old) — ${cached.data.length} jobs`);
        return cached.data;
    }

    console.log('🤖 [LinkedIn] Fetching live LinkedIn jobs (last 24h)...');
    const allJobs: NormalizedJob[] = [];
    const seenIds = new Set<string>();

    for (const query of QUERIES) {
        try {
            const { data } = await axios.get(LINKEDIN_API_BASE, {
                params: {
                    limit: '100',
                    offset: '0',
                    title_filter: query.title_filter,
                    location_filter: query.location_filter,
                    description_type: 'text',
                },
                headers: {
                    'x-rapidapi-key': apiKey,
                    'x-rapidapi-host': LINKEDIN_API_HOST,
                    'Content-Type': 'application/json',
                },
                timeout: 20000,
            });

            const results: any[] = Array.isArray(data) ? data : (data?.data || data?.jobs || []);
            console.log(`🤖 [LinkedIn] Query "${query.location_filter.split('"')[1]}": ${results.length} results`);

            for (const job of results) {
                const id = `linkedin_${job.id || job.job_id || job.linkedin_id || Math.random()}`;
                if (seenIds.has(id)) continue;
                seenIds.add(id);

                const title = job.title || job.job_title || 'Untitled';
                const description = job.description || job.job_description || '';

                if (!isJuniorJob(title, description)) continue;

                const company = job.company || job.company_name || 'Unknown Company';
                const location = job.location || job.job_location || '';
                const isRemote = location.toLowerCase().includes('remote') || job.remote === true;

                allJobs.push({
                    title,
                    company,
                    companyLogo: job.company_logo || job.logo ||
                        `https://unavatar.io/${company.toLowerCase().replace(/\s+/g, '')}.com`,
                    location: location || (isRemote ? 'Remote' : 'India'),
                    city: job.city || (isRemote ? 'Remote' : (location.split(',')[0] || 'India')),
                    type: mapJobType(title),
                    mode: isRemote ? 'Remote' : 'Onsite',
                    salary: job.salary || job.salary_range || '',
                    description: description.slice(0, 2000),
                    tags: [
                        ...(job.skills || job.required_skills || []),
                        job.employment_type,
                        'LinkedIn',
                    ].filter(Boolean).slice(0, 10),
                    source: 'linkedin' as any,
                    externalId: id,
                    externalUrl: job.url || job.apply_url || job.linkedin_url || '',
                    posted: timeAgo(job.posted_at || job.date_posted || null),
                });
            }
        } catch (err: any) {
            const status = err?.response?.status;
            if (status === 429 || status === 402) {
                console.warn(`⚠️ [LinkedIn] Monthly quota exhausted (${status}) — serving cache if available`);
                const stale = readCache();
                return stale?.data || [];
            }
            console.warn(`⚠️ [LinkedIn] Query failed: ${err.message}`);
        }
    }

    console.log(`🤖 [LinkedIn] Total: ${allJobs.length} junior/intern jobs from LinkedIn (last 24h)`);

    if (allJobs.length > 0) {
        writeCache(allJobs);
    }

    return allJobs;
}
