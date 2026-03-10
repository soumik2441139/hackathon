"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchAllJobs = fetchAllJobs;
exports.getBotStatus = getBotStatus;
exports.getBotJobStats = getBotJobStats;
const Job_1 = require("./models/Job");
const remotive_provider_1 = require("./providers/remotive.provider");
const arbeitnow_provider_1 = require("./providers/arbeitnow.provider");
const adzuna_provider_1 = require("./providers/adzuna.provider");
const telegram_provider_1 = require("./providers/telegram.provider");
const translator_1 = require("./providers/translator");
let lastStatus = {
    lastRun: null,
    results: [],
    totalNew: 0,
    totalDuplicates: 0,
};
const BLOCKED_LOCATIONS = [
    'germany', 'switzerland', 'berlin', 'munich', 'frankfurt', 'zurich', 'geneva', 'basel', 'hamburg', 'cologne', 'stuttgart', 'dusseldorf', 'bern', 'lausanne'
];
function isBlockedJob(job) {
    const textToCheck = `${job.location} ${job.city} ${job.title}`.toLowerCase();
    const regex = new RegExp(`\\b(${BLOCKED_LOCATIONS.join('|')})\\b`, 'i');
    return regex.test(textToCheck);
}
async function storeJobs(jobs, sourceName) {
    const result = {
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
            const exists = await Job_1.BotJob.findOne({ externalId: job.externalId });
            if (exists) {
                result.duplicates++;
                continue;
            }
            const created = await Job_1.BotJob.create({
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
            if (result.insertedIds)
                result.insertedIds.push(created._id.toString());
        }
        catch (err) {
            if (err.code === 11000) {
                result.duplicates++;
            }
            else {
                result.errors.push(`${job.title}: ${err.message}`);
            }
        }
    }
    return result;
}
async function fetchAllJobs() {
    console.log('🤖 ═══════════════════════════════════════');
    console.log('🤖 RECRUITER BOT — Fetch cycle starting...');
    console.log('🤖 ═══════════════════════════════════════');
    const results = [];
    const [remotiveRaw, arbeitnowRaw, adzunaRaw, telegramRaw] = await Promise.all([
        (0, remotive_provider_1.fetchRemotiveJobs)(),
        (0, arbeitnow_provider_1.fetchArbeitnowJobs)(),
        (0, adzuna_provider_1.fetchAdzunaJobs)(),
        (0, telegram_provider_1.fetchTelegramJobs)(),
    ]);
    // Auto-translate non-English jobs to English
    console.log('🌐 [Translator] Checking for non-English jobs...');
    const [remotiveJobs, arbeitnowJobs, adzunaJobs, telegramJobs] = await Promise.all([
        (0, translator_1.translateJobs)(remotiveRaw),
        (0, translator_1.translateJobs)(arbeitnowRaw),
        (0, translator_1.translateJobs)(adzunaRaw),
        (0, translator_1.translateJobs)(telegramRaw),
    ]);
    if (remotiveJobs.length > 0) {
        results.push(await storeJobs(remotiveJobs, 'remotive'));
    }
    else {
        results.push({ source: 'remotive', fetched: 0, newJobs: 0, duplicates: 0, errors: [] });
    }
    if (arbeitnowJobs.length > 0) {
        results.push(await storeJobs(arbeitnowJobs, 'arbeitnow'));
    }
    else {
        results.push({ source: 'arbeitnow', fetched: 0, newJobs: 0, duplicates: 0, errors: [] });
    }
    if (adzunaJobs.length > 0) {
        results.push(await storeJobs(adzunaJobs, 'adzuna'));
    }
    else {
        results.push({ source: 'adzuna', fetched: 0, newJobs: 0, duplicates: 0, errors: ['Skipped — no API keys'] });
    }
    if (telegramJobs.length > 0) {
        results.push(await storeJobs(telegramJobs, 'telegram'));
    }
    else {
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
function getBotStatus() {
    return lastStatus;
}
async function getBotJobStats() {
    const [total, remotive, arbeitnow, adzuna, telegram] = await Promise.all([
        Job_1.BotJob.countDocuments({ source: { $ne: 'manual' } }),
        Job_1.BotJob.countDocuments({ source: 'remotive' }),
        Job_1.BotJob.countDocuments({ source: 'arbeitnow' }),
        Job_1.BotJob.countDocuments({ source: 'adzuna' }),
        Job_1.BotJob.countDocuments({ source: 'telegram' }),
    ]);
    return { total, remotive, arbeitnow, adzuna, telegram };
}
//# sourceMappingURL=bot.service.js.map