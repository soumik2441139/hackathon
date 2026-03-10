import axios from 'axios';

interface RawRemotiveJob {
    id: number;
    url: string;
    title: string;
    company_name: string;
    company_logo: string | null;
    category: string;
    tags: string[];
    job_type: string;
    publication_date: string;
    candidate_required_location: string;
    salary: string;
    description: string;
}

export interface NormalizedJob {
    title: string;
    company: string;
    companyLogo: string;
    location: string;
    city: string;
    type: 'Internship' | 'Full-time' | 'Part-time' | 'Contract';
    mode: 'Remote' | 'Hybrid' | 'Onsite';
    salary: string;
    description: string;
    tags: string[];
    responsibilities?: string[];
    requirements?: string[];
    source: 'remotive' | 'arbeitnow' | 'adzuna' | 'telegram';
    externalId: string;
    externalUrl: string;
    posted: string;
}

const REMOTIVE_API = 'https://remotive.com/api/remote-jobs';

const JUNIOR_KEYWORDS = [
    'intern', 'internship', 'junior', 'entry', 'entry-level',
    'graduate', 'fresher', 'trainee', 'associate', 'starter',
    'apprentice', 'beginner', 'jr', 'jr.', 'new grad',
];

function isJuniorJob(title: string, description: string): boolean {
    const text = `${title} ${description}`.toLowerCase();
    return JUNIOR_KEYWORDS.some(kw => text.includes(kw));
}

function mapJobType(type: string): 'Internship' | 'Full-time' | 'Part-time' | 'Contract' {
    const t = type.toLowerCase();
    if (t.includes('intern')) return 'Internship';
    if (t.includes('contract') || t.includes('freelance')) return 'Contract';
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

export async function fetchRemotiveJobs(): Promise<NormalizedJob[]> {
    console.log('🤖 [Remotive] Fetching jobs...');

    try {
        const { data } = await axios.get(REMOTIVE_API, {
            params: { limit: 100 },
            timeout: 15000,
        });

        const rawJobs: RawRemotiveJob[] = data.jobs || [];
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
            mode: 'Remote' as const,
            salary: job.salary || '',
            description: stripHtml(job.description).slice(0, 2000),
            tags: job.tags || [job.category],
            source: 'remotive' as const,
            externalId: `remotive_${job.id}`,
            externalUrl: job.url,
            posted: timeAgo(job.publication_date),
        }));
    } catch (err: any) {
        console.error('❌ [Remotive] Fetch failed:', err.message);
        return [];
    }
}
