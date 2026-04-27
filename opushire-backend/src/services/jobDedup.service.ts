import crypto from 'crypto';
import IORedis from 'ioredis';
import { SystemConfig } from '../config/system.config';
import { log, logError } from '../utils/logger';

const JOB_DEDUP_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

/** Lazy singleton Redis client for dedup (reuses primary Redis config) */
let dedupClient: IORedis | null = null;

function getDedupClient(): IORedis {
    if (!dedupClient) {
        const config = SystemConfig.redis;
        dedupClient = new IORedis({
            host: config.host,
            port: config.port,
            ...(config.password ? { password: config.password } : {}),
            ...(config.tls ? { tls: { servername: config.host, rejectUnauthorized: false } } : {}),
            maxRetriesPerRequest: 3,
            enableOfflineQueue: false,
            connectionName: 'jobdedup',
        });
        dedupClient.on('error', (err) => {
            logError('JOB_DEDUP', 'Redis connection error', err);
        });
    }
    return dedupClient;
}

/**
 * Hashes a job URL to a short fixed-length key for Redis.
 * Prevents overly long Redis keys when URLs contain query params.
 */
function hashUrl(url: string): string {
    return crypto.createHash('sha256').update(url).digest('hex').slice(0, 20);
}

function buildRedisKey(candidateId: string, jobUrl: string): string {
    return `jobmatch:${candidateId}:${hashUrl(jobUrl)}`;
}

/**
 * Filters a list of jobs to only those not yet seen for this candidate.
 * Marks newly-seen jobs in Redis with a 7-day TTL.
 */
export async function filterNewJobs<T extends { job_url?: string; applyUrl?: string }>(
    candidateId: string,
    jobs: T[],
): Promise<T[]> {
    const client = getDedupClient();
    const newJobs: T[] = [];

    for (const job of jobs) {
        const url = job.job_url || job.applyUrl || '';
        if (!url) continue;

        const key = buildRedisKey(candidateId, url);

        try {
            // SET NX: only set if key doesn't exist — atomic check+set
            const set = await client.set(key, '1', 'EX', JOB_DEDUP_TTL_SECONDS, 'NX');
            if (set === 'OK') {
                // Key didn't exist → new job
                newJobs.push(job);
            }
            // If set === null, key already existed → duplicate, skip
        } catch (err: any) {
            // On Redis error, treat as new (fail-open) so we don't silently drop jobs
            log('JOB_DEDUP', `Redis check failed for ${url}, failing open: ${err.message}`);
            newJobs.push(job);
        }
    }

    return newJobs;
}
