"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchAdzunaJobs = fetchAdzunaJobs;
const axios_1 = __importDefault(require("axios"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
/**
 * Adzuna Job Provider — Phase 2
 * Fetches internship & junior jobs from Adzuna's API (16+ countries)
 *
 * Rate limiting: caches results for 8 hours to stay within the 250 req/month trial tier.
 */
const ADZUNA_API = 'https://api.adzuna.com/v1/api/jobs';
const CACHE_DIR = path_1.default.join(__dirname, '..', '..', '.cache');
const CACHE_FILE = path_1.default.join(CACHE_DIR, 'adzuna_cache.json');
const CACHE_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours
function readCache() {
    try {
        if (!fs_1.default.existsSync(CACHE_FILE))
            return null;
        const data = JSON.parse(fs_1.default.readFileSync(CACHE_FILE, 'utf-8'));
        if (Date.now() - data.timestamp < CACHE_TTL_MS) {
            return data;
        }
    }
    catch { /* cache corrupt, ignore */ }
    return null;
}
function writeCache(jobs) {
    try {
        fs_1.default.mkdirSync(CACHE_DIR, { recursive: true });
        const data = { timestamp: Date.now(), jobs };
        fs_1.default.writeFileSync(CACHE_FILE, JSON.stringify(data));
    }
    catch (e) {
        console.warn(`⚠️ [Adzuna] Cache write failed: ${e.message}`);
    }
}
const JUNIOR_KEYWORDS = [
    'intern', 'internship', 'junior', 'entry', 'entry-level',
    'graduate', 'fresher', 'trainee', 'associate', 'starter',
    'apprentice', 'beginner', 'jr', 'jr.', 'new grad',
];
function isJuniorJob(title, description) {
    const text = `${title} ${description}`.toLowerCase();
    return JUNIOR_KEYWORDS.some(kw => text.includes(kw));
}
function mapJobType(contractType, title) {
    const t = (contractType || '').toLowerCase();
    const titleLower = title.toLowerCase();
    if (titleLower.includes('intern') || t.includes('intern'))
        return 'Internship';
    if (t.includes('contract'))
        return 'Contract';
    if (t.includes('part'))
        return 'Part-time';
    return 'Full-time';
}
function timeAgo(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0)
        return 'Today';
    if (days === 1)
        return '1 day ago';
    if (days < 7)
        return `${days} days ago`;
    if (days < 30)
        return `${Math.floor(days / 7)} weeks ago`;
    return `${Math.floor(days / 30)} months ago`;
}
function stripHtml(html) {
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
async function fetchAdzunaJobs() {
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
    const allJobs = [];
    const seenIds = new Set();
    for (const country of SEARCH_COUNTRIES) {
        for (const query of SEARCH_QUERIES) {
            try {
                const { data } = await axios_1.default.get(`${ADZUNA_API}/${country}/search/1`, {
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
                    if (seenIds.has(id))
                        continue;
                    seenIds.add(id);
                    // Extra filter to ensure it's truly junior
                    if (!isJuniorJob(job.title || '', job.description || ''))
                        continue;
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
                        source: 'adzuna',
                        externalId: id,
                        externalUrl: job.redirect_url || '',
                        posted: timeAgo(job.created || new Date().toISOString()),
                    });
                }
            }
            catch (err) {
                // Don't fail the whole batch on one request error
                console.warn(`⚠️ [Adzuna] ${country}/${query} failed: ${err.message}`);
            }
        }
    }
    console.log(`🤖 [Adzuna] Total: ${allJobs.length} junior/intern jobs found`);
    writeCache(allJobs);
    return allJobs;
}
//# sourceMappingURL=adzuna.provider.js.map