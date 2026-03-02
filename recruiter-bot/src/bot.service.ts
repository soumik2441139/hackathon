import { BotJob } from './models/Job';
import { fetchRemotiveJobs, NormalizedJob } from './providers/remotive.provider';
import { fetchArbeitnowJobs } from './providers/arbeitnow.provider';
import { fetchAdzunaJobs } from './providers/adzuna.provider';
import { fetchTelegramJobs } from './providers/telegram.provider';
import { translateJobs } from './providers/translator';

export interface FetchResult {
    source: string;
    fetched: number;
    newJobs: number;
    duplicates: number;
    errors: string[];
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

async function storeJobs(jobs: NormalizedJob[], sourceName: string): Promise<FetchResult> {
    const result: FetchResult = {
        source: sourceName,
        fetched: jobs.length,
        newJobs: 0,
        duplicates: 0,
        errors: [],
    };

    for (const job of jobs) {
        try {
            const exists = await BotJob.findOne({ externalId: job.externalId });
            if (exists) {
                result.duplicates++;
                continue;
            }

            await BotJob.create({
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

    const [remotiveRaw, arbeitnowRaw, adzunaRaw, telegramRaw] = await Promise.all([
        fetchRemotiveJobs(),
        fetchArbeitnowJobs(),
        fetchAdzunaJobs(),
        fetchTelegramJobs(),
    ]);

    // Auto-translate non-English jobs to English
    console.log('🌐 [Translator] Checking for non-English jobs...');
    const [remotiveJobs, arbeitnowJobs, adzunaJobs, telegramJobs] = await Promise.all([
        translateJobs(remotiveRaw),
        translateJobs(arbeitnowRaw),
        translateJobs(adzunaRaw),
        translateJobs(telegramRaw),
    ]);

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
    const [total, remotive, arbeitnow, adzuna, telegram] = await Promise.all([
        BotJob.countDocuments({ source: { $ne: 'manual' } }),
        BotJob.countDocuments({ source: 'remotive' }),
        BotJob.countDocuments({ source: 'arbeitnow' }),
        BotJob.countDocuments({ source: 'adzuna' }),
        BotJob.countDocuments({ source: 'telegram' }),
    ]);
    return { total, remotive, arbeitnow, adzuna, telegram };
}
