import { log, logError } from './logger';

/**
 * Circuit Breaker for external API calls (LLM APIs, etc.)
 *
 * States:
 *   CLOSED   → Normal operation, requests pass through
 *   OPEN     → Requests fail immediately (fast-fail)
 *   HALF_OPEN → One test request allowed to probe recovery
 *
 * Configurable thresholds:
 *   failureThreshold   — consecutive failures before opening
 *   resetTimeoutMs     — how long to stay OPEN before trying HALF_OPEN
 *   successThreshold   — consecutive successes in HALF_OPEN before closing
 */

type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

interface CircuitBreakerOptions {
  name: string;
  failureThreshold?: number;
  resetTimeoutMs?: number;
  successThreshold?: number;
}

export class CircuitBreaker {
  private state: CircuitState = 'CLOSED';
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime = 0;

  private readonly name: string;
  private readonly failureThreshold: number;
  private readonly resetTimeoutMs: number;
  private readonly successThreshold: number;

  constructor(opts: CircuitBreakerOptions) {
    this.name = opts.name;
    this.failureThreshold = opts.failureThreshold ?? 5;
    this.resetTimeoutMs = opts.resetTimeoutMs ?? 30_000; // 30 seconds
    this.successThreshold = opts.successThreshold ?? 2;
  }

  async exec<T>(fn: () => Promise<T>): Promise<T> {
    // Check if we should transition from OPEN → HALF_OPEN
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime >= this.resetTimeoutMs) {
        this.state = 'HALF_OPEN';
        log('CIRCUIT_BREAKER', `${this.name}: OPEN → HALF_OPEN (probing)`);
      } else {
        throw new CircuitOpenError(
          `${this.name} circuit is OPEN — fast-failing to prevent cascade`,
        );
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (err) {
      this.onFailure(err);
      throw err;
    }
  }

  private onSuccess() {
    if (this.state === 'HALF_OPEN') {
      this.successCount++;
      if (this.successCount >= this.successThreshold) {
        this.state = 'CLOSED';
        this.failureCount = 0;
        this.successCount = 0;
        log('CIRCUIT_BREAKER', `${this.name}: HALF_OPEN → CLOSED (recovered)`);
      }
    } else {
      // In CLOSED state, reset failure count on success
      this.failureCount = 0;
    }
  }

  private onFailure(err: any) {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    this.successCount = 0;

    logError('CIRCUIT_BREAKER', `${this.name} failure #${this.failureCount}`, err);

    if (this.state === 'HALF_OPEN') {
      // Single failure in HALF_OPEN trips back to OPEN
      this.state = 'OPEN';
      log('CIRCUIT_BREAKER', `${this.name}: HALF_OPEN → OPEN (probe failed)`);
    } else if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
      log('CIRCUIT_BREAKER', `${this.name}: CLOSED → OPEN after ${this.failureCount} failures`);
    }
  }

  getState(): { name: string; state: CircuitState; failures: number } {
    return { name: this.name, state: this.state, failures: this.failureCount };
  }
}

export class CircuitOpenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CircuitOpenError';
  }
}

// ─── Pre-configured breakers for each LLM provider ──────────────

export const geminiBreaker = new CircuitBreaker({
  name: 'Gemini',
  failureThreshold: 5,
  resetTimeoutMs: 30_000,
  successThreshold: 2,
});

export const groqBreaker = new CircuitBreaker({
  name: 'Groq',
  failureThreshold: 5,
  resetTimeoutMs: 30_000,
  successThreshold: 2,
});
