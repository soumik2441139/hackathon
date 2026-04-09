import { Options, ipKeyGenerator } from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { CacheService } from '../services/cache/cache.service';
import { Request } from 'express';

/**
 * Standardizes IP extraction by stripping the port number if present.
 * express-rate-limit's default validator can fail on "IP:Port" strings often seen in proxy setups.
 */
export const getCleanIp = (req: Request): string => {
    const rawIp = req.ip || req.socket.remoteAddress || 'unknown';
    // Remove IPv4 port (e.g., 1.2.3.4:5678 -> 1.2.3.4)
    // and handle IPv6 wrapped in brackets if necessary.
    return rawIp.split(':').length > 2 ? rawIp : rawIp.split(':')[0];
};

/**
 * Factory for rate limiters to ensure consistency and avoid Store reuse.
 * @param prefix - Unique prefix for Redis keys (e.g., 'global', 'auth')
 */
export const getRateLimitConfig = (prefix: string): Partial<Options> => ({
    standardHeaders: true,
    legacyHeaders: false,
    passOnStoreError: true,
    keyGenerator: (req: Request) => ipKeyGenerator(getCleanIp(req)),
    validate: {
        xForwardedForHeader: false,
        ip: false,
    },
    // Distributed Rate Limiting (Enterprise Pattern)
    ...(CacheService.isEnabled && CacheService.getClient() ? {
        store: new RedisStore({
            prefix: `rl:${prefix}:`,
            sendCommand: async (...args: string[]) => {
                const client = CacheService.getClient();
                if (!client) {
                    throw new Error('Redis client not available');
                }
                return await client.call(args[0], ...args.slice(1)) as any;
            },
        }),
    } : {})
});
