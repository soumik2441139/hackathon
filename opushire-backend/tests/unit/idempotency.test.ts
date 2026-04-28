import { createIdempotencyMiddleware } from '../../src/middleware/idempotency';
import { Request, Response, NextFunction } from 'express';

/**
 * Idempotency Middleware Unit Tests
 *
 * Tests the core behaviors without a real Redis connection:
 *   1. Passes through GET/DELETE requests untouched
 *   2. Passes through POST requests without an Idempotency-Key header
 *   3. Returns cached response for duplicate keys
 *   4. Rejects overly long keys
 *   5. Degrades gracefully when Redis is null
 *   6. Blocks concurrent duplicate requests (lock contention)
 */

// ─── Mock Redis Client ──────────────────────────────────────────
function createMockRedis(store: Record<string, string> = {}) {
  return {
    get: jest.fn(async (key: string) => store[key] || null),
    set: jest.fn(async (...args: any[]) => {
      const [key, value, ...rest] = args;
      // Simulate SET NX behavior
      if (rest.includes('NX') && store[key]) return null;
      store[key] = value;
      return 'OK';
    }),
    del: jest.fn(async (key: string) => {
      delete store[key];
      return 1;
    }),
  };
}

function createMockReq(overrides: Partial<Request> = {}): Partial<Request> {
  return {
    method: 'POST',
    headers: {},
    ...overrides,
  };
}

function createMockRes(): Partial<Response> & { _status: number; _body: any } {
  const res: any = {
    _status: 200,
    _body: null,
    _headers: {} as Record<string, string>,
    statusCode: 200,
    status(code: number) {
      res._status = code;
      res.statusCode = code;
      return res;
    },
    json(body: any) {
      res._body = body;
      return res;
    },
    setHeader(key: string, value: string) {
      res._headers[key] = value;
    },
  };
  return res;
}

describe('Idempotency Middleware', () => {
  it('should pass through GET requests without checking Redis', async () => {
    const mockRedis = createMockRedis();
    const middleware = createIdempotencyMiddleware(() => mockRedis);
    const req = createMockReq({ method: 'GET', headers: { 'idempotency-key': 'abc' } });
    const res = createMockRes();
    const next = jest.fn();

    await middleware(req as Request, res as unknown as Response, next);

    expect(next).toHaveBeenCalled();
    expect(mockRedis.get).not.toHaveBeenCalled();
  });

  it('should pass through POST requests without an Idempotency-Key header', async () => {
    const mockRedis = createMockRedis();
    const middleware = createIdempotencyMiddleware(() => mockRedis);
    const req = createMockReq({ method: 'POST', headers: {} });
    const res = createMockRes();
    const next = jest.fn();

    await middleware(req as Request, res as unknown as Response, next);

    expect(next).toHaveBeenCalled();
  });

  it('should reject keys longer than 256 characters', async () => {
    const mockRedis = createMockRedis();
    const middleware = createIdempotencyMiddleware(() => mockRedis);
    const longKey = 'x'.repeat(257);
    const req = createMockReq({ headers: { 'idempotency-key': longKey } });
    const res = createMockRes();
    const next = jest.fn();

    await middleware(req as Request, res as unknown as Response, next);

    expect(next).not.toHaveBeenCalled();
    expect(res._status).toBe(400);
    expect(res._body.message).toContain('256');
  });

  it('should return cached response for duplicate idempotency key', async () => {
    const cachedResponse = JSON.stringify({
      status: 201,
      body: { success: true, id: 'job-123' },
      headers: {},
    });
    const store: Record<string, string> = {
      'idem:res:my-unique-key': cachedResponse,
    };
    const mockRedis = createMockRedis(store);
    const middleware = createIdempotencyMiddleware(() => mockRedis);
    const req = createMockReq({ headers: { 'idempotency-key': 'my-unique-key' } });
    const res = createMockRes();
    const next = jest.fn();

    await middleware(req as Request, res as unknown as Response, next);

    expect(next).not.toHaveBeenCalled();
    expect(res._status).toBe(201);
    expect(res._body).toEqual({ success: true, id: 'job-123' });
    expect((res as any)._headers['X-Idempotent-Replayed']).toBe('true');
  });

  it('should degrade gracefully when Redis client is null', async () => {
    const middleware = createIdempotencyMiddleware(() => null);
    const req = createMockReq({ headers: { 'idempotency-key': 'some-key' } });
    const res = createMockRes();
    const next = jest.fn();

    await middleware(req as Request, res as unknown as Response, next);

    expect(next).toHaveBeenCalled();
  });

  it('should block concurrent duplicate requests with 409', async () => {
    // Simulate a lock already held by another request
    const store: Record<string, string> = {
      'idem:lock:concurrent-key': '1',
    };
    const mockRedis = createMockRedis(store);
    const middleware = createIdempotencyMiddleware(() => mockRedis);
    const req = createMockReq({ headers: { 'idempotency-key': 'concurrent-key' } });
    const res = createMockRes();
    const next = jest.fn();

    await middleware(req as Request, res as unknown as Response, next);

    expect(next).not.toHaveBeenCalled();
    expect(res._status).toBe(409);
    expect(res._body.message).toContain('currently being processed');
  });

  it('should allow first POST request through and call next()', async () => {
    const mockRedis = createMockRedis();
    const middleware = createIdempotencyMiddleware(() => mockRedis);
    const req = createMockReq({ headers: { 'idempotency-key': 'fresh-key' } });
    const res = createMockRes();
    const next = jest.fn();

    await middleware(req as Request, res as unknown as Response, next);

    expect(next).toHaveBeenCalled();
    // Lock should have been acquired
    expect(mockRedis.set).toHaveBeenCalledWith(
      'idem:lock:fresh-key', '1', 'EX', 30, 'NX'
    );
  });
});
