import { Counter, Histogram, Gauge } from 'prom-client';

// ─── LLM Observability ──────────────────────────────────────────

/** Tracks latency of every LLM API call, bucketed by model and status. */
export const llmLatency = new Histogram({
    name: 'opushire_llm_response_seconds',
    help: 'LLM API call latency in seconds',
    labelNames: ['model', 'status'] as const,
    buckets: [0.5, 1, 2, 5, 10, 30],
});

// ─── Agent Quality ──────────────────────────────────────────────

/** Counts hallucinations caught by the supervisor worker. */
export const hallucinationsTotal = new Counter({
    name: 'opushire_hallucinations_caught_total',
    help: 'Number of hallucinated tags rejected by the supervisor agent',
});

/** Counts total supervisor verdicts (approve + reject) for acceptance rate calculation. */
export const supervisorVerdicts = new Counter({
    name: 'opushire_supervisor_verdicts_total',
    help: 'Total supervisor agent verdicts',
    labelNames: ['verdict'] as const,
});

// ─── Circuit Breaker ────────────────────────────────────────────

/** Tracks every state transition (CLOSED→OPEN, OPEN→HALF_OPEN, etc.) */
export const circuitBreakerTransitions = new Counter({
    name: 'opushire_circuit_breaker_transitions_total',
    help: 'Circuit breaker state transitions',
    labelNames: ['from_state', 'to_state'] as const,
});

// ─── Queue Health ───────────────────────────────────────────────

/** Gauge for active/waiting jobs per logical queue name. */
export const queueDepth = new Gauge({
    name: 'opushire_queue_depth',
    help: 'Current number of waiting jobs per queue',
    labelNames: ['queue_name'] as const,
});
