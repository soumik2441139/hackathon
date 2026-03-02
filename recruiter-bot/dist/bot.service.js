"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchAllJobs = fetchAllJobs;
exports.getBotStatus = getBotStatus;
exports.getBotJobStats = getBotJobStats;
const Job_1 = require("./models/Job");
const remotive_provider_1 = require("./providers/remotive.provider");
const arbeitnow_provider_1 = require("./providers/arbeitnow.provider");
const adzuna_provider_1 = require("./providers/adzuna.provider");
let lastStatus = {
    lastRun: null,
    results: [],
    totalNew: 0,
    totalDuplicates: 0,
};
async function storeJobs(jobs, sourceName) {
    const result = {
        source: sourceName,
        fetched: jobs.length,
        newJobs: 0,
        duplicates: 0,
        errors: [],
    };
    for (const job of jobs) {
        try {
            const exists = await Job_1.BotJob.findOne({ externalId: job.externalId });
            if (exists) {
                result.duplicates++;
                continue;
            }
            await Job_1.BotJob.create({
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
                responsibilities: [],
                requirements: [],
            });
            result.newJobs++;
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
    const [remotiveJobs, arbeitnowJobs, adzunaJobs] = await Promise.all([
        (0, remotive_provider_1.fetchRemotiveJobs)(),
        (0, arbeitnow_provider_1.fetchArbeitnowJobs)(),
        (0, adzuna_provider_1.fetchAdzunaJobs)(),
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
    const [total, remotive, arbeitnow, adzuna] = await Promise.all([
        Job_1.BotJob.countDocuments({ source: { $ne: 'manual' } }),
        Job_1.BotJob.countDocuments({ source: 'remotive' }),
        Job_1.BotJob.countDocuments({ source: 'arbeitnow' }),
        Job_1.BotJob.countDocuments({ source: 'adzuna' }),
    ]);
    return { total, remotive, arbeitnow, adzuna };
}
//# sourceMappingURL=bot.service.js.map