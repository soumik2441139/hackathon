import axios from 'axios';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { NormalizedJob } from './remotive.provider';

/**
 * Active Jobs DB Provider — via RapidAPI
 * Host:     active-jobs-db.p.rapidapi.com
 * Refreshed hourly, 175,000+ organizations in the database
 *
 * Free Plan Limits:
 *   - 25 requests / month  (HARD LIMIT — ~1/day)
 *   - 100 jobs per request
 *   - 250 jobs / month total
 *
 * Strategy: 2 targeted queries per run.
 *           Cache results for 23h to survive multiple daily bot restarts.
 *
 * Env var: JSEARCH_API_KEY (same RapidAPI key linked to your account)
 */

const ACTIVE_JOBS_HOST   = 'active-jobs-db.p.rapidapi.com';
const ACTIVE_JOBS_BASE   = `https://${ACTIVE_JOBS_HOST}/get-job-details`;
const CACHE_FILE         = path.join(os.tmpdir(), 'activejobsdb_cache.json');
const CACHE_TTL_MS       = 23 * 60 * 60 * 1000; // 23 hours

// ─── Targeted queries ─────────────────────────────────────────────────────────
// title_filter and location_filter are regex strings
const QUERIES = [
    {
        title_filter:    '(?i)(junior|intern|entry.level|graduate|fresher|trainee|associate)',
        location_filter: '(?i)(india|bengaluru|bangalore|hyderabad|pune|mumbai|delhi|chennai)',
        description_type: 'text',
    },
    {
        title_filter:    '(?i)(junior|intern|entry.level|graduate|associate)',
        location_filter: '(?i)(remote|anywhere)',
        description_type: 'text',
    },
];

const JUNIOR_KW = [
    'intern', 'internship', 'junior', 'entry', 'entry-level', 'entry level',
    'graduate', 'fresher', 'trainee', 'associate', 'jr.', 'new grad',
];

function isJunior(title: string, desc: string): boolean {
    const txt = `${title} ${desc}`.toLowerCase();
    return JUNIOR_KW.some(k => txt.includes(k));
}

function mapType(title: string): 'Internship' | 'Full-time' | 'Part-time' | 'Contract' {
    const t = title.toLowerCase();
    if (t.includes('intern')) return 'Internship';
    if (t.includes('contract') || t.includes('freelance')) return 'Contract';
    if (t.includes('part')) return 'Part-time';
    return 'Full-time';
}

function timeAgo(dateStr: string | null | undefined): string {
    if (!dateStr) return 'Recent';
    const diff = Date.now() - new Date(dateStr).getTime();
    const hrs  = Math.floor(diff / 3_600_000);
    if (hrs < 2)  return '< 1 hour ago';
    if (hrs < 24) return `${hrs} hours ago`;
    const days = Math.floor(hrs / 24);
    if (days === 1) return '1 day ago';
    if (days < 7)   return `${days} days ago`;
    return `${Math.floor(days / 7)} weeks ago`;
}

// ─── Cache helpers ────────────────────────────────────────────────────────────

function readCache(): { data: NormalizedJob[]; ts: number } | null {
    try {
        if (fs.existsSync(CACHE_FILE)) return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
    } catch { /* ignore */ }
    return null;
}

function writeCache(jobs: NormalizedJob[]): void {
    try {
        fs.writeFileSync(CACHE_FILE, JSON.stringify({ data: jobs, ts: Date.now() }), 'utf8');
        console.log(`💾 [ActiveJobsDB] Cache written — ${jobs.length} jobs`);
    } catch { /* ignore */ }
}

// ─── Main fetch ───────────────────────────────────────────────────────────────

export async function fetchActiveJobsDB(): Promise<NormalizedJob[]> {
    const apiKey = process.env.JSEARCH_API_KEY;
    if (!apiKey) {
        console.log('⏭️  [ActiveJobsDB] Skipped — JSEARCH_API_KEY not set');
        return [];
    }

    // Serve from cache if fresh
    const cached = readCache();
    if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
        const ageHrs = ((Date.now() - cached.ts) / 3_600_000).toFixed(1);
        console.log(`💾 [ActiveJobsDB] Cache HIT (${ageHrs}h old) — ${cached.data.length} jobs`);
        return cached.data;
    }

    console.log('🤖 [ActiveJobsDB] Fetching live jobs from 175,000+ companies...');
    const allJobs: NormalizedJob[] = [];
    const seenIds = new Set<string>();

    for (const query of QUERIES) {
        try {
            const { data } = await axios.get(ACTIVE_JOBS_BASE, {
                params: {
                    limit:            '100',
                    offset:           '0',
                    title_filter:     query.title_filter,
                    location_filter:  query.location_filter,
                    description_type: query.description_type,
                },
                headers: {
                    'x-rapidapi-key':  apiKey,
                    'x-rapidapi-host': ACTIVE_JOBS_HOST,
                    'Content-Type':    'application/json',
                },
                timeout: 20000,
            });

            const results: any[] = Array.isArray(data) ? data : (data?.data || data?.jobs || []);
            console.log(`🤖 [ActiveJobsDB] Query "${query.location_filter}": ${results.length} results`);

            for (const job of results) {
                const id = `activejobsdb_${job.id || job.job_id || Math.random()}`;
                if (seenIds.has(id)) continue;
                seenIds.add(id);

                const title    = job.title || job.job_title || 'Untitled';
                const desc     = job.description || job.job_description || '';

                if (!isJunior(title, desc)) continue;

                const company  = job.company || job.company_name || 'Unknown Company';
                const location = job.location || job.job_location || '';
                const isRemote = location.toLowerCase().includes('remote') || job.remote === true;

                allJobs.push({
                    title,
                    company,
                    companyLogo: job.company_logo || job.logo ||
                        `https://unavatar.io/${company.toLowerCase().replace(/\s+/g, '')}.com`,
                    location: location || (isRemote ? 'Remote' : 'India'),
                    city:     job.city || (isRemote ? 'Remote' : (location.split(',')[0] || 'India')),
                    type:     mapType(title),
                    mode:     isRemote ? 'Remote' : (job.job_type === 'hybrid' ? 'Hybrid' : 'Onsite'),
                    salary:   job.salary || job.salary_range || '',
                    description: desc.slice(0, 2000),
                    tags: [
                        ...(job.skills || job.required_skills || []),
                        job.employment_type,
                        'ActiveJobsDB',
                    ].filter(Boolean).slice(0, 10),
                    source:      'activejobsdb' as any,
                    externalId:  id,
                    externalUrl: job.url || job.apply_url || job.job_url || '',
                    posted:      timeAgo(job.posted_at || job.date_posted || job.created_at),
                });
            }
        } catch (err: any) {
            const status = err?.response?.status;
            if (status === 429 || status === 402) {
                console.warn(`⚠️ [ActiveJobsDB] Quota exhausted (${status}) — using stale cache`);
                const stale = readCache();
                return stale?.data || [];
            }
            console.warn(`⚠️ [ActiveJobsDB] Query failed: ${err.message}`);
        }
    }

    console.log(`🤖 [ActiveJobsDB] Total: ${allJobs.length} junior/intern jobs`);
    if (allJobs.length > 0) writeCache(allJobs);
    return allJobs;
}
