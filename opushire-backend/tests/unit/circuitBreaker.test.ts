import { CircuitBreaker, CircuitOpenError } from '../../src/utils/circuitBreaker';

// Mock the logger and metrics so tests don't spam stdout or require prom-client setup
jest.mock('../../src/utils/logger', () => ({
    log: jest.fn(),
    logError: jest.fn(),
}));

jest.mock('../../src/metrics/business.metrics', () => ({
    circuitBreakerTransitions: { inc: jest.fn() },
}));

describe('CircuitBreaker', () => {
    let breaker: CircuitBreaker;

    beforeEach(() => {
        breaker = new CircuitBreaker({
            name: 'test-breaker',
            failureThreshold: 3,
            resetTimeoutMs: 100,    // Short timeout for fast tests
            successThreshold: 2,
        });
    });

    it('starts in CLOSED state', () => {
        expect(breaker.getState().state).toBe('CLOSED');
    });

    it('passes through successful calls in CLOSED state', async () => {
        const result = await breaker.exec(() => Promise.resolve('hello'));
        expect(result).toBe('hello');
        expect(breaker.getState().state).toBe('CLOSED');
    });

    it('stays CLOSED after fewer failures than threshold', async () => {
        for (let i = 0; i < 2; i++) {
            await breaker.exec(() => Promise.reject(new Error('fail'))).catch(() => {});
        }
        expect(breaker.getState().state).toBe('CLOSED');
        expect(breaker.getState().failures).toBe(2);
    });

    it('opens after failureThreshold consecutive failures', async () => {
        for (let i = 0; i < 3; i++) {
            await breaker.exec(() => Promise.reject(new Error('fail'))).catch(() => {});
        }
        expect(breaker.getState().state).toBe('OPEN');
    });

    it('rejects calls immediately when OPEN', async () => {
        // Trip the breaker
        for (let i = 0; i < 3; i++) {
            await breaker.exec(() => Promise.reject(new Error('fail'))).catch(() => {});
        }

        await expect(breaker.exec(() => Promise.resolve('nope')))
            .rejects.toThrow(CircuitOpenError);
    });

    it('transitions to HALF_OPEN after resetTimeout elapsed', async () => {
        // Trip the breaker
        for (let i = 0; i < 3; i++) {
            await breaker.exec(() => Promise.reject(new Error('fail'))).catch(() => {});
        }
        expect(breaker.getState().state).toBe('OPEN');

        // Wait for reset timeout
        await new Promise(resolve => setTimeout(resolve, 150));

        // Next call should go through (HALF_OPEN probe)
        const result = await breaker.exec(() => Promise.resolve('probe'));
        expect(result).toBe('probe');
        // After 1 success, still HALF_OPEN (need successThreshold=2)
        expect(breaker.getState().state).toBe('HALF_OPEN');
    });

    it('closes after successThreshold successes in HALF_OPEN', async () => {
        for (let i = 0; i < 3; i++) {
            await breaker.exec(() => Promise.reject(new Error('fail'))).catch(() => {});
        }

        await new Promise(resolve => setTimeout(resolve, 150));

        // 2 successful calls should close the breaker
        await breaker.exec(() => Promise.resolve('ok1'));
        await breaker.exec(() => Promise.resolve('ok2'));

        expect(breaker.getState().state).toBe('CLOSED');
        expect(breaker.getState().failures).toBe(0);
    });

    it('reopens on failure in HALF_OPEN', async () => {
        for (let i = 0; i < 3; i++) {
            await breaker.exec(() => Promise.reject(new Error('fail'))).catch(() => {});
        }

        await new Promise(resolve => setTimeout(resolve, 150));

        // Probe fails → goes back to OPEN
        await breaker.exec(() => Promise.reject(new Error('probe-fail'))).catch(() => {});
        expect(breaker.getState().state).toBe('OPEN');
    });

    it('resets failure count on success in CLOSED state', async () => {
        await breaker.exec(() => Promise.reject(new Error('fail'))).catch(() => {});
        await breaker.exec(() => Promise.reject(new Error('fail'))).catch(() => {});
        expect(breaker.getState().failures).toBe(2);

        await breaker.exec(() => Promise.resolve('ok'));
        expect(breaker.getState().failures).toBe(0);
    });
});
