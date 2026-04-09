"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchRemotiveJobs = fetchRemotiveJobs;
const axios_1 = __importDefault(require("axios"));
const he_1 = __importDefault(require("he"));
const REMOTIVE_API = 'https://remotive.com/api/remote-jobs';
const JUNIOR_KEYWORDS = [
    'intern', 'internship', 'junior', 'entry', 'entry-level',
    'graduate', 'fresher', 'trainee', 'associate', 'starter',
    'apprentice', 'beginner', 'jr', 'jr.', 'new grad',
];
function isJuniorJob(title, description) {
    const text = `${title} ${description}`.toLowerCase();
    return JUNIOR_KEYWORDS.some(kw => text.includes(kw));
}
function mapJobType(type) {
    const t = type.toLowerCase();
    if (t.includes('intern'))
        return 'Internship';
    if (t.includes('contract') || t.includes('freelance'))
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
    if (!html)
        return '';
    const stripped = html
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/?[^>]+(>|$)/g, '');
    return he_1.default.decode(stripped).trim();
}
async function fetchRemotiveJobs() {
    console.log('🤖 [Remotive] Fetching jobs...');
    try {
        const { data } = await axios_1.default.get(REMOTIVE_API, {
            params: { limit: 100 },
            timeout: 15000,
        });
        const rawJobs = data.jobs || [];
        console.log(`🤖 [Remotive] Received ${rawJobs.length} total jobs`);
        const juniorJobs = rawJobs.filter(j => isJuniorJob(j.title, j.description));
        console.log(`🤖 [Remotive] Filtered to ${juniorJobs.length} junior/intern jobs`);
        return juniorJobs.map(job => ({
            title: job.title,
            company: job.company_name,
            companyLogo: job.company_logo || `https://unavatar.io/${job.company_name.toLowerCase().replace(/\s+/g, '')}.com`,
            location: job.candidate_required_location || 'Remote',
            city: 'Remote',
            type: mapJobType(job.job_type),
            mode: 'Remote',
            salary: job.salary || '',
            description: stripHtml(job.description).slice(0, 2000),
            tags: job.tags || [job.category],
            source: 'remotive',
            externalId: `remotive_${job.id}`,
            externalUrl: job.url,
            posted: timeAgo(job.publication_date),
        }));
    }
    catch (err) {
        console.error('❌ [Remotive] Fetch failed:', err.message);
        return [];
    }
}
//# sourceMappingURL=remotive.provider.js.map