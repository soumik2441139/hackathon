import axios from 'axios';
import he from 'he';
import { NormalizedJob } from './remotive.provider';

interface RawHimalayasJob {
    id: number;
    title: string;
    companyName: string;
    companyLogo: string | null;
    applicationLink: string;
    description: string;
    salaryRange?: string;
    employmentType: string;
    pubDate: string;
    locationRestrictions?: string[];
    categories?: string[];
}

const HIMALAYAS_API = 'https://himalayas.app/jobs/api?limit=100';

const JUNIOR_TECH_KEYWORDS = [
    'intern', 'internship', 'junior', 'entry', 'entry-level',
    'graduate', 'fresher', 'associate', 'jr', 'jr.', 'new grad',
    'engineer', 'developer', 'frontend', 'backend', 'fullstack', 
    'full stack', 'software', 'programmer'
];

function isTechJob(title: string): boolean {
    const text = title.toLowerCase();
    return JUNIOR_TECH_KEYWORDS.some(kw => text.includes(kw));
}

function mapJobType(type: string): 'Internship' | 'Full-time' | 'Part-time' | 'Contract' {
    const t = (type || '').toLowerCase();
    if (t.includes('intern')) return 'Internship';
    if (t.includes('contract') || t.includes('freelance')) return 'Contract';
    if (t.includes('part')) return 'Part-time';
    return 'Full-time';
}

function stripHtml(html: string): string {
    if (!html) return '';
    const stripped = html
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/?[^>]+(>|$)/g, '');
    
    return he.decode(stripped).trim();
}

function timeAgo(dateTimestamp: number): string {
    const diff = (Date.now() / 1000) - dateTimestamp; 
    const days = Math.floor(diff / (60 * 60 * 24));
    if (days <= 0) return 'Today';
    if (days === 1) return '1 day ago';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return `${Math.floor(days / 30)} months ago`;
}

export async function fetchHimalayasJobs(): Promise<NormalizedJob[]> {
    console.log('🤖 [Himalayas] Fetching premium startup jobs...');

    try {
        const { data } = await axios.get(HIMALAYAS_API, {
            timeout: 15000,
            headers: { 'Accept': 'application/json' }
        });

        const rawJobs: RawHimalayasJob[] = data.jobs || [];
        console.log(`🤖 [Himalayas] Received ${rawJobs.length} total premium jobs`);

        // Filter explicitly for Junior Tech roles
        const techJobs = rawJobs.filter(j => isTechJob(j.title));
        console.log(`🤖 [Himalayas] Filtered to ${techJobs.length} junior tech startup roles`);

        return techJobs.map(job => ({
            title: job.title,
            company: job.companyName,
            // Himalayas usually provides high quality logos, fallback to unavatar just in case
            companyLogo: job.companyLogo || `https://unavatar.io/${job.companyName.toLowerCase().replace(/\\s+/g, '')}.com`,
            location: job.locationRestrictions ? job.locationRestrictions.join(', ') : 'Remote',
            city: 'Remote',
            type: mapJobType(job.employmentType),
            mode: 'Remote' as const,
            salary: job.salaryRange || '',
            description: stripHtml(job.description).slice(0, 2000),
            tags: job.categories || [],
            source: 'himalayas' as const,
            externalId: `himalayas_${job.id}`,
            externalUrl: job.applicationLink,
            posted: timeAgo(parseInt(job.pubDate) || Date.now()/1000)
        }));
    } catch (err: any) {
        console.error('❌ [Himalayas] Fetch failed:', err.message);
        return [];
    }
}
