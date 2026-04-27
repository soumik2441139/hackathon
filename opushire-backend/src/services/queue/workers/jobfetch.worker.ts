import { createWorker, enqueue } from '../queue.service';
import { getCandidateProfile }  from '../../candidate.service';
import { fetchLiveJobs }        from '../../jobFetcher.service';
import { filterNewJobs }        from '../../jobDedup.service';
import { antigravityScore }     from '../../antigravity.service';
import { JobMatch }             from '../../../models/JobMatch';
import BotStat                  from '../../../models/BotStat';
import mongoose                 from 'mongoose';
import { log }                  from '../../../utils/logger';

export function registerJobFetchWorker() {
    createWorker('fetch-jobs', async (data: { candidateId: string }) => {
        const { candidateId } = data;

        // ── 1. Build candidate profile ──────────────────────────────
        const profile = await getCandidateProfile(candidateId);
        if (!profile) {
            log('JOB_FETCH', `No profile found for candidate ${candidateId}`);
            return { skipped: true, reason: 'no_profile' };
        }

        // ── 2. Fetch live jobs via ts-jobspy ────────────────────────
        const rawJobs = await fetchLiveJobs(profile);
        if (rawJobs.length === 0) {
            return { skipped: true, reason: 'no_jobs_fetched' };
        }

        // ── 3. Redis dedup — only process unseen jobs ───────────────
        const newJobs = await filterNewJobs(candidateId, rawJobs);
        console.log(`[JobFetch] ${candidateId}: ${rawJobs.length} fetched → ${newJobs.length} new`);

        if (newJobs.length === 0) {
            return { fetched: rawJobs.length, newJobs: 0, saved: 0 };
        }

        // ── 4. Antigravity scoring via OpenRouter ───────────────────
        const scoredJobs = await antigravityScore(profile, newJobs);
        console.log(`[JobFetch] ${scoredJobs.length} jobs scored ≥ 40 for candidate ${candidateId}`);

        if (scoredJobs.length === 0) {
            return { fetched: rawJobs.length, newJobs: newJobs.length, saved: 0 };
        }

        // ── 5. Save to JobMatch collection ──────────────────────────
        const docs = scoredJobs.map(j => ({
            candidateId:      new mongoose.Types.ObjectId(candidateId),
            jobTitle:         j.title,
            company:          j.company,
            applyUrl:         j.apply_url,
            source:           j.source,
            antigravityScore: j.score,
            matchedSkills:    j.matched_skills || [],
            missingSkills:    j.missing_skills || [],
            remote:           j.remote ?? false,
            location:         j.location || '',
            seniority:        j.seniority || 'Junior',
            rawTitle:         j.title,
            fetchedAt:        j.fetched_at ? new Date(j.fetched_at) : new Date(),
            sentToCandidate:  false,
            expiresAt:        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        }));

        let saved = 0;
        try {
            const result = await JobMatch.insertMany(docs, {
                ordered: false,    // don't stop on duplicate key errors
            });
            saved = result.length;
        } catch (err: any) {
            // Partial success — some inserted, some duplicates
            if (err.code === 11000 || err.name === 'BulkWriteError') {
                saved = err.result?.nInserted ?? 0;
                log('JOB_FETCH', `${saved} saved, rest were duplicates`);
            } else {
                throw err;
            }
        }

        // ── 6. Update stats ─────────────────────────────────────────
        if (saved > 0) {
            await BotStat.incrementMetric('jobMatchesSaved', saved).catch(() => {});
            // ── 7. Trigger Outreach immediately ─────────────────────
            await enqueue('job-outreach', 'immediate-outreach', { candidateId }).catch(() => {});
        }

        return {
            fetched:   rawJobs.length,
            newJobs:   newJobs.length,
            scored:    scoredJobs.length,
            saved,
        };
    });
}
