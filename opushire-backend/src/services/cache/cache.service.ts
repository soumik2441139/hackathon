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
                enableOfflineQueue: true,
                connectionName: 'api-cache-tier1',
                // Implements Enterprise pattern: Exponential backoff
                retryStrategy: (times) => Math.min(times * 100, 3000),
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
