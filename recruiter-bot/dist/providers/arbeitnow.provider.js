"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchArbeitnowJobs = fetchArbeitnowJobs;
const axios_1 = __importDefault(require("axios"));
const ARBEITNOW_API = 'https://www.arbeitnow.com/api/job-board-api';
const JUNIOR_KEYWORDS = [
    'intern', 'internship', 'junior', 'entry', 'entry-level',
    'graduate', 'fresher', 'trainee', 'associate', 'starter',
    'apprentice', 'beginner', 'jr', 'jr.', 'new grad',
];
function isJuniorJob(title, description) {
    const text = `${title} ${description}`.toLowerCase();
    return JUNIOR_KEYWORDS.some(kw => text.includes(kw));
}
function mapJobType(types) {
    const joined = types.join(' ').toLowerCase();
    if (joined.includes('intern'))
        return 'Internship';
    if (joined.includes('contract') || joined.includes('freelance'))
        return 'Contract';
    if (joined.includes('part'))
        return 'Part-time';
    return 'Full-time';
}
function timeAgo(timestamp) {
    const diff = Date.now() - timestamp * 1000;
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
function extractCity(location) {
    if (!location)
        return 'Remote';
    const parts = location.split(',');
    return parts[0]?.trim() || 'Remote';
}
async function fetchArbeitnowJobs() {
    console.log('🤖 [Arbeitnow] Fetching jobs...');
    const allJobs = [];
    try {
        for (let page = 1; page <= 2; page++) {
            const { data } = await axios_1.default.get(ARBEITNOW_API, {
                params: { page },
                timeout: 15000,
            });
            const rawJobs = data.data || [];
            console.log(`🤖 [Arbeitnow] Page ${page}: ${rawJobs.length} jobs`);
            const juniorJobs = rawJobs.filter(j => isJuniorJob(j.title, j.description));
            for (const job of juniorJobs) {
                allJobs.push({
                    title: job.title,
                    company: job.company_name,
                    companyLogo: job.company_logo || `https://unavatar.io/${job.company_name.toLowerCase().replace(/\s+/g, '')}.com`,
                    location: job.location || (job.remote ? 'Remote' : 'Unknown'),
                    city: job.remote ? 'Remote' : extractCity(job.location),
                    type: mapJobType(job.job_types),
                    mode: job.remote ? 'Remote' : 'Onsite',
                    salary: '',
                    description: stripHtml(job.description).slice(0, 2000),
                    tags: job.tags || [],
                    source: 'arbeitnow',
                    externalId: `arbeitnow_${job.slug}`,
                    externalUrl: job.url,
                    posted: timeAgo(job.created_at),
                });
            }
        }
        console.log(`🤖 [Arbeitnow] Filtered to ${allJobs.length} junior/intern jobs`);
        return allJobs;
    }
    catch (err) {
        console.error('❌ [Arbeitnow] Fetch failed:', err.message);
        return allJobs;
    }
}
//# sourceMappingURL=arbeitnow.provider.js.map