import IORedis from 'ioredis';
import { SystemConfig } from '../../config/system.config';
import { logError } from '../../utils/logger';

class CacheManager {
    private client: IORedis | null = null;
    public readonly isEnabled: boolean;

    constructor() {
        if (SystemConfig.redisTertiaryUrl) {
            this.client = new IORedis(SystemConfig.redisTertiaryUrl, {
                maxRetriesPerRequest: null,
                // Fail fast (5 s) instead of hanging for the OS default (~10 s).
                // Without this, every cold start of a hibernated Render instance
                // generates a flood of ETIMEDOUT log entries before the first retry.
                connectTimeout: 5000,
                // Don't connect eagerly on module load — wait for the first
                // actual cache.get/set call. This prevents hammering a sleeping
                // Render node before probeRedis() has had a chance to run.
                lazyConnect: true,
                enableOfflineQueue: true,
                connectionName: 'api-cache-tier1',
                // Cap backoff at 30 s so a fully-dead Render instance doesn't
                // create a high-frequency retry hot-loop.
                retryStrategy: (times) => Math.min(times * 200, 30000),
                reconnectOnError: () => true
            });
            this.client.on('error', (err) => logError('CACHE_TIER1', 'Redis Cache Error', err));
            this.isEnabled = true;
        } else {
            this.isEnabled = false;
        }
    }

    public getClient(): IORedis | null {
        return this.client;
    }

    public async get<T>(key: string): Promise<T | null> {
        if (!this.client) return null;
        try {
            const data = await this.client.get(key);
            if (!data) return null;
            return JSON.parse(data) as T;
        } catch (err) {
            logError('CACHE_TIER1', `Error getting cache key: ${key}`, err);
            return null;
        }
    }

    public async set(key: string, value: any, ttlSeconds: number = 3600): Promise<void> {
        if (!this.client) return;
        try {
            await this.client.set(key, JSON.stringify(value), 'EX', ttlSeconds);
        } catch (err) {
            logError('CACHE_TIER1', `Error setting cache key: ${key}`, err);
        }
    }

    public async del(key: string): Promise<void> {
        if (!this.client) return;
        try {
            await this.client.del(key);
        } catch (err) {
            logError('CACHE_TIER1', `Error deleting cache key: ${key}`, err);
        }
    }
}

export const CacheService = new CacheManager();
