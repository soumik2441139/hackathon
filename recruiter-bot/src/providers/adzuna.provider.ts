import axios from 'axios';
import he from 'he';
import fs from 'fs';
import path from 'path';
import { NormalizedJob } from './remotive.provider';

/**
 * Adzuna Job Provider — Phase 2
 * Fetches internship & junior jobs from Adzuna's API (16+ countries)
 *
 * Rate limiting: caches results for 8 hours to stay within the 250 req/month trial tier.
 */

const ADZUNA_API = 'https://api.adzuna.com/v1/api/jobs';
const CACHE_DIR = path.join(__dirname, '..', '..', '.cache');
const CACHE_FILE = path.join(CACHE_DIR, 'adzuna_cache.json');
const CACHE_TTL_MS        = 8 * 60 * 60 * 1000; // 8 hours  — normal refresh
const CACHE_TTL_EMPTY_MS  = 1 * 60 * 60 * 1000; // 1 hour   — retry sooner if last fetch returned 0
const CACHE_VERSION       = 2;                   // bump to auto-invalidate old format caches

interface AdzunaCache {
    version: number;               // schema version — mismatches force a fresh fetch
    timestamp: number;             // when this entry was written
    lastSuccessTimestamp: number;  // when we last stored > 0 jobs
    jobs: NormalizedJob[];
    fetchedCount: number;          // raw jobs from API before junior filter
}

/** Returns the cache if it is still fresh, null if expired or corrupt. */
function readCache(): AdzunaCache | null {
    try {
        if (!fs.existsSync(CACHE_FILE)) return null;
        const data: AdzunaCache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));

        // Invalidate old cache format automatically
        if (data.version !== CACHE_VERSION) {
            console.log('♻️  [Adzuna] Cache version mismatch — invalidating');
            return null;
        }

        const age     = Date.now() - data.timestamp;
        const ttl     = data.jobs.length === 0 ? CACHE_TTL_EMPTY_MS : CACHE_TTL_MS;
        const ageMin  = Math.round(age / 60000);

        if (age < ttl) {
            const status = data.jobs.length === 0
                ? `⚠️  empty cache — retrying in ${Math.round((ttl - age) / 60000)}m`
                : `${data.jobs.length} jobs`;
            console.log(`♻️  [Adzuna] Cache hit (${ageMin}m old) — ${status}`);
            return data;
        }
    } catch { /* corrupt — force fresh fetch */ }
    return null;
}

/**
 * Writes jobs to cache.
 * IMPORTANT: never overwrites a good cache with 0 results.
 * If the new fetch returned nothing, the previous non-empty cache is preserved.
 */
function writeCache(jobs: NormalizedJob[], fetchedCount: number): void {
    try {
        fs.mkdirSync(CACHE_DIR, { recursive: true });

        // Read the old cache to check if it has jobs worth preserving
        let lastSuccessTimestamp = Date.now();
        if (jobs.length === 0 && fs.existsSync(CACHE_FILE)) {
            try {
                const old: AdzunaCache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
                if (old.version === CACHE_VERSION && old.jobs.length > 0) {
                    // Preserve the old good jobs — only update the timestamp so TTL resets
                    console.warn(`⚠️  [Adzuna] Fresh fetch returned 0 — keeping ${old.jobs.length} cached jobs from ${Math.round((Date.now() - old.lastSuccessTimestamp) / 60000)}m ago`);
                    const preserved: AdzunaCache = {
                        ...old,
                        timestamp: Date.now(),   // reset TTL so we don't retry immediately
                    };
                    fs.writeFileSync(CACHE_FILE, JSON.stringify(preserved));
                    return;
                }
            } catch { /* old cache corrupt, fall through and write empty */ }
            lastSuccessTimestamp = 0; // mark: never had a successful fetch
        }

        const data: AdzunaCache = {
            version: CACHE_VERSION,
            timestamp: Date.now(),
            lastSuccessTimestamp: jobs.length > 0 ? Date.now() : lastSuccessTimestamp,
            jobs,
            fetchedCount,
        };
        fs.writeFileSync(CACHE_FILE, JSON.stringify(data));
        console.log(`💾 [Adzuna] Cache written — ${jobs.length} jobs (${fetchedCount} fetched before filter)`);
    } catch (e: any) {
        console.warn(`⚠️ [Adzuna] Cache write failed: ${e.message}`);
    }
}

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
    if (!html) return '';
    const stripped = html
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/?[^>]+(>|$)/g, '');
    
    return he.decode(stripped).trim();
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

    // Return cached results if still fresh (saves ~15 API calls per cycle)
    const cached = readCache();
    if (cached) {
        console.log(`♻️  [Adzuna] Serving ${cached.jobs.length} cached jobs (${Math.round((Date.now() - cached.timestamp) / 60000)}m old)`);
        return cached.jobs;
    }

    console.log('🤖 [Adzuna] Fetching jobs (cache miss)...');
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
                        companyLogo: `https://unavatar.io/${companyName.toLowerCase().replace(/\s+/g, '')}.com`,
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

    console.log(`🤖 [Adzuna] Total: ${allJobs.length} junior/intern jobs found (from ${seenIds.size} unique raw results)`);
    writeCache(allJobs, seenIds.size);
    return allJobs;
}
