import { Request, Response, NextFunction } from 'express';
import { log, logError } from '../utils/logger';

/**
 * Idempotency Key Middleware
 *
 * Prevents duplicate processing of POST/PUT/PATCH requests by caching
 * responses keyed by the `Idempotency-Key` header in Redis.
 *
 * Flow:
 *   1. Client sends request with `Idempotency-Key: <uuid>` header
 *   2. Middleware checks Redis for an existing response under that key
 *   3. If found → returns the cached response (no re-processing)
 *   4. If not found → processes the request, caches the response with 24h TTL
 *
 * Edge Cases Handled:
 *   - Concurrent duplicate requests: uses Redis `SET NX` to acquire a lock
 *   - Missing key on GET/DELETE: silently passes through (idempotent by nature)
 *   - Redis unavailable: gracefully degrades (request proceeds normally)
 *
 * @example
 *   // Client usage:
 *   fetch('/api/jobs', {
 *     method: 'POST',
 *     headers: { 'Idempotency-Key': crypto.randomUUID() },
 *     body: JSON.stringify(jobData)
 *   });
 *
 * @see https://stripe.com/docs/api/idempotent_requests (industry standard)
 */

const IDEMPOTENCY_TTL_SECONDS = 86400; // 24 hours
const LOCK_PREFIX = 'idem:lock:';
const RESPONSE_PREFIX = 'idem:res:';
const LOCK_TTL_SECONDS = 30; // Lock timeout for in-flight requests

interface CachedResponse {
  status: number;
  body: any;
  headers: Record<string, string>;
}

/**
 * Creates the idempotency middleware.
 * Requires a Redis client (IORedis) to be passed in — fails gracefully if null.
 */
export function createIdempotencyMiddleware(getRedisClient: () => any) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Only apply to mutation methods
    if (!['POST', 'PUT', 'PATCH'].includes(req.method)) {
      return next();
    }

    const idempotencyKey = req.headers['idempotency-key'] as string | undefined;

    // No key provided — proceed normally
    if (!idempotencyKey) {
      return next();
    }

    // Validate key format (should be a UUID-like string, max 256 chars)
    if (idempotencyKey.length > 256) {
      res.status(400).json({
        success: false,
        message: 'Idempotency-Key must be at most 256 characters',
      });
      return;
    }

    const redis = getRedisClient();
    if (!redis) {
      // Redis unavailable — degrade gracefully, process normally
      log('IDEMPOTENCY', 'Redis unavailable, skipping idempotency check');
      return next();
    }

    const lockKey = `${LOCK_PREFIX}${idempotencyKey}`;
    const responseKey = `${RESPONSE_PREFIX}${idempotencyKey}`;

    try {
      // 1. Check for existing cached response
      const cached = await redis.get(responseKey);
      if (cached) {
        const cachedResponse: CachedResponse = JSON.parse(cached);
        log('IDEMPOTENCY', `Returning cached response for key: ${idempotencyKey.substring(0, 8)}...`);
        res.setHeader('X-Idempotent-Replayed', 'true');
        res.status(cachedResponse.status).json(cachedResponse.body);
        return;
      }

      // 2. Acquire a lock (SET NX) to prevent concurrent duplicate processing
      const lockAcquired = await redis.set(lockKey, '1', 'EX', LOCK_TTL_SECONDS, 'NX');
      if (!lockAcquired) {
        // Another request with the same key is currently being processed
        res.status(409).json({
          success: false,
          message: 'A request with this Idempotency-Key is currently being processed. Please retry shortly.',
        });
        return;
      }

      // 3. Intercept the response to cache it
      const originalJson = res.json.bind(res);
      res.json = function (body: any) {
        // Cache the response asynchronously (don't block the response)
        const responseToCache: CachedResponse = {
          status: res.statusCode,
          body,
          headers: {},
        };

        redis.set(
          responseKey,
          JSON.stringify(responseToCache),
          'EX',
          IDEMPOTENCY_TTL_SECONDS,
        ).catch((err: any) => {
          logError('IDEMPOTENCY', 'Failed to cache response', err);
        });

        // Release the lock
        redis.del(lockKey).catch((err: any) => {
          logError('IDEMPOTENCY', 'Failed to release lock', err);
        });

        return originalJson(body);
      };

      next();
    } catch (err) {
      // Redis error — degrade gracefully
      logError('IDEMPOTENCY', 'Middleware error, proceeding without idempotency', err);
      // Clean up lock on error
      redis.del(lockKey).catch(() => {});
      next();
    }
  };
}
