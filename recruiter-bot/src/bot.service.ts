import { BotJob } from './models/Job';
import { fetchRemotiveJobs, NormalizedJob } from './providers/remotive.provider';
import { fetchArbeitnowJobs } from './providers/arbeitnow.provider';
import { fetchAdzunaJobs } from './providers/adzuna.provider';
import { fetchTelegramJobs } from './providers/telegram.provider';
import { translateJobs } from './providers/translator';
import { fetchHimalayasJobs } from './providers/himalayas.provider';
import { fetchJSearchJobs } from './providers/jsearch.provider';
import { filterSpamJobs } from './providers/spam-filter';

export interface FetchResult {
    source: string;
    fetched: number;
    newJobs: number;
    duplicates: number;
    errors: string[];
    insertedIds?: string[];
}

export interface BotStatus {
    lastRun: Date | null;
    results: FetchResult[];
    totalNew: number;
    totalDuplicates: number;
}

let lastStatus: BotStatus = {
    lastRun: null,
    results: [],
    totalNew: 0,
    totalDuplicates: 0,
};

const BLOCKED_LOCATIONS = [
    'germany', 'switzerland', 'berlin', 'munich', 'frankfurt', 'zurich', 'geneva', 'basel', 'hamburg', 'cologne', 'stuttgart', 'dusseldorf', 'bern', 'lausanne'
];

function isBlockedJob(job: NormalizedJob): boolean {
    const textToCheck = `${job.location} ${job.city} ${job.title}`.toLowerCase();
    const regex = new RegExp(`\\b(${BLOCKED_LOCATIONS.join('|')})\\b`, 'i');
    return regex.test(textToCheck);
}

async function storeJobs(jobs: NormalizedJob[], sourceName: string): Promise<FetchResult> {
    const result: FetchResult = {
        source: sourceName,
        fetched: jobs.length,
        newJobs: 0,
        duplicates: 0,
        errors: [],
        insertedIds: []
    };

    for (const job of jobs) {
        if (isBlockedJob(job)) {
            result.errors.push(`Excluded location: ${job.location || job.city || job.title}`);
            continue;
        }

        try {
            // [PHASE 2] Clearbit Universal Auto-Branding Algorithm
            let isUnavatar = false;
            try {
                if (job.companyLogo) {
                    const hostname = new URL(job.companyLogo).hostname;
                    isUnavatar = hostname === 'unavatar.io' || hostname.endsWith('.unavatar.io');
                }
            } catch { /* ignore invalid URLs */ }

            if (!job.companyLogo || isUnavatar || job.companyLogo.trim() === '') {
                 // Aggressively format "T-Mobile!" -> "tmobile.com" to align with Clearbit API expectations
                 const cleanName = job.company.toLowerCase().replace(/[^a-z0-9]/g, '');
                 if (cleanName.length > 2) {
                     job.companyLogo = `https://logo.clearbit.com/${cleanName}.com`;
                 }
            }

            const exists = await BotJob.findOne({ externalId: job.externalId });
            if (exists) {
                result.duplicates++;
                continue;
            }

            const created = await BotJob.create({
                title: job.title,
                company: job.company,
                companyLogo: job.companyLogo,
                location: job.location,
                city: job.city,
                type: job.type,
                mode: job.mode,
                salary: job.salary,
                description: job.description,
                tags: job.tags,
                source: job.source,
                externalId: job.externalId,
                externalUrl: job.externalUrl,
                posted: job.posted,
                featured: false,
                openings: 1,
                responsibilities: job.responsibilities || [],
                requirements: job.requirements || [],
            });

            result.newJobs++;
            if (result.insertedIds) result.insertedIds.push(created._id.toString());
        } catch (err: any) {
            if (err.code === 11000) {
                result.duplicates++;
            } else {
                result.errors.push(`${job.title}: ${err.message}`);
            }
        }
    }

    return result;
}

export async function fetchAllJobs(): Promise<BotStatus> {
    console.log('🤖 ═══════════════════════════════════════');
    console.log('🤖 RECRUITER BOT — Fetch cycle starting...');
    console.log('🤖 ═══════════════════════════════════════');

    const results: FetchResult[] = [];

    const [remotiveRaw, arbeitnowRaw, adzunaRaw, telegramRaw, himalayasRaw, jsearchRaw] = await Promise.all([
        fetchRemotiveJobs(),
        fetchArbeitnowJobs(),
        fetchAdzunaJobs(),
        fetchTelegramJobs(),
        fetchHimalayasJobs(),
        fetchJSearchJobs(),
    ]);

    // Auto-translate non-English jobs to English
    console.log('🌐 [Translator] Checking for non-English jobs...');
    const [remotiveJobsAI, arbeitnowJobsAI, adzunaJobsAI, telegramJobsAI, himalayasJobsAI, jsearchJobsAI] = await Promise.all([
        translateJobs(remotiveRaw),
        translateJobs(arbeitnowRaw),
        translateJobs(adzunaRaw),
        translateJobs(telegramRaw),
        translateJobs(himalayasRaw),
        translateJobs(jsearchRaw),
    ]);

    console.log('🛡️ [Spam Filter] Auditing payloads for garbage via strict Llama-3 AI firewall...');
    const remotiveJobs = await filterSpamJobs(remotiveJobsAI);
    const arbeitnowJobs = await filterSpamJobs(arbeitnowJobsAI);
    const adzunaJobs = await filterSpamJobs(adzunaJobsAI);
    const telegramJobs = await filterSpamJobs(telegramJobsAI);
    const himalayasJobs = await filterSpamJobs(himalayasJobsAI);
    const jsearchJobs = await filterSpamJobs(jsearchJobsAI);

    if (remotiveJobs.length > 0) {
        results.push(await storeJobs(remotiveJobs, 'remotive'));
    } else {
        results.push({ source: 'remotive', fetched: 0, newJobs: 0, duplicates: 0, errors: [] });
    }

    if (arbeitnowJobs.length > 0) {
        results.push(await storeJobs(arbeitnowJobs, 'arbeitnow'));
    } else {
        results.push({ source: 'arbeitnow', fetched: 0, newJobs: 0, duplicates: 0, errors: [] });
    }

    if (adzunaJobs.length > 0) {
        results.push(await storeJobs(adzunaJobs, 'adzuna'));
    } else {
        results.push({ source: 'adzuna', fetched: 0, newJobs: 0, duplicates: 0, errors: ['Skipped — no API keys'] });
    }

    if (telegramJobs.length > 0) {
        results.push(await storeJobs(telegramJobs, 'telegram'));
    } else {
        results.push({ source: 'telegram', fetched: 0, newJobs: 0, duplicates: 0, errors: [] });
    }

    if (himalayasJobs.length > 0) {
        results.push(await storeJobs(himalayasJobs, 'himalayas'));
    } else {
        results.push({ source: 'himalayas', fetched: 0, newJobs: 0, duplicates: 0, errors: [] });
    }

    if (jsearchJobs.length > 0) {
        results.push(await storeJobs(jsearchJobs, 'jsearch'));
    } else {
        results.push({ source: 'jsearch', fetched: 0, newJobs: 0, duplicates: 0, errors: ['Skipped — JSEARCH_API_KEY not set'] });
    }

    const totalNew = results.reduce((sum, r) => sum + r.newJobs, 0);
    const totalDuplicates = results.reduce((sum, r) => sum + r.duplicates, 0);

    lastStatus = { lastRun: new Date(), results, totalNew, totalDuplicates };

    console.log('🤖 ═══════════════════════════════════════');
    console.log(`🤖 DONE — ${totalNew} new jobs stored, ${totalDuplicates} duplicates skipped`);
    console.log('🤖 ═══════════════════════════════════════');

    return lastStatus;
}

export function getBotStatus(): BotStatus {
    return lastStatus;
}

export async function getBotJobStats() {
    const [total, remotive, arbeitnow, adzuna, telegram, himalayas, jsearch] = await Promise.all([
        BotJob.countDocuments({ source: { $ne: 'manual' } }),
        BotJob.countDocuments({ source: 'remotive' }),
        BotJob.countDocuments({ source: 'arbeitnow' }),
        BotJob.countDocuments({ source: 'adzuna' }),
        BotJob.countDocuments({ source: 'telegram' }),
        BotJob.countDocuments({ source: 'himalayas' }),
        BotJob.countDocuments({ source: 'jsearch' }),
    ]);
    return { total, remotive, arbeitnow, adzuna, telegram, himalayas, jsearch };
}
