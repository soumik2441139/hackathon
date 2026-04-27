import { scrapeJobs } from 'ts-jobspy';
import { CandidateProfile } from './candidate.service';
import { log } from '../utils/logger';

const HOURS_OLD   = 24;
const RESULTS_CAP = 50;

export interface RawJob {
    job_url: string;
    title: string;
    company: string;
    location: string;
    is_remote: boolean;
    description: string;
    date_posted: string | null;
    site: string;
    [key: string]: unknown;
}

/**
 * Fetches live job listings for a candidate from LinkedIn, Indeed, and Naukri.
 * Always limits to last 24 hours and ~50 results to keep Redis dedup efficient.
 */
export async function fetchLiveJobs(profile: CandidateProfile): Promise<RawJob[]> {
    const searchTerms = profile.preferredRoles.slice(0, 2); // max 2 queries
    const location    = profile.location;
    const allJobs: RawJob[] = [];
    const seenUrls    = new Set<string>();

    for (const searchTerm of searchTerms) {
        try {
            log('JOB_FETCHER', `Fetching: "${searchTerm}" @ ${location}`);

            const result = await scrapeJobs({
                siteName:       ['linkedin', 'indeed', 'naukri'],
                searchTerm,
                location,
                resultsWanted:  RESULTS_CAP,
                hoursOld:       HOURS_OLD,
                isRemote:       profile.remote,
                countryIndeed:  'IN',  // India-focused
            } as unknown as Parameters<typeof scrapeJobs>[0]);

            // ts-jobspy returns { jobs: RawJob[] } in v2.x
            type ScrapeResult = { jobs?: RawJob[] } | RawJob[];
            const untypedResult = result as unknown as ScrapeResult;
            let jobs: RawJob[] = [];
            
            if (untypedResult && !Array.isArray(untypedResult) && 'jobs' in untypedResult && Array.isArray(untypedResult.jobs)) {
                jobs = untypedResult.jobs;
            } else if (Array.isArray(untypedResult)) {
                jobs = untypedResult;
            }

            for (const job of jobs) {
                const url = job.job_url;
                if (!url || seenUrls.has(url)) continue;
                seenUrls.add(url);
                allJobs.push(job);
            }

            log('JOB_FETCHER', `"${searchTerm}": ${jobs.length} results`);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            log('JOB_FETCHER', `Search "${searchTerm}" failed: ${msg}`);
        }
    }

    log('JOB_FETCHER', `Total: ${allJobs.length} unique jobs across all queries`);
    return allJobs;
}
