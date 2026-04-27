/**
 * OpusHire API Load Test
 *
 * Validates that the API can handle concurrent requests under load.
 * Run with: npx autocannon -c 50 -d 30 -p 10 http://localhost:5000/api/jobs
 *
 * Or use this script directly with k6:
 *   k6 run loadtest/api.loadtest.js
 *
 * Target: 200+ requests/second sustained for 30 seconds
 *         P99 latency < 500ms for read endpoints
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// ─── Custom Metrics ──────────────────────────────────────────────
const errorRate = new Rate('errors');
const jobsLatency = new Trend('jobs_list_latency', true);
const healthLatency = new Trend('health_check_latency', true);

// ─── Test Configuration ──────────────────────────────────────────
export const options = {
    stages: [
        { duration: '10s', target: 20 },   // Ramp up to 20 VUs
        { duration: '30s', target: 50 },   // Sustain 50 VUs
        { duration: '10s', target: 100 },  // Spike to 100 VUs
        { duration: '10s', target: 0 },    // Ramp down
    ],
    thresholds: {
        http_req_duration: ['p(95)<500', 'p(99)<1000'],  // P95 < 500ms, P99 < 1s
        errors: ['rate<0.05'],                            // Error rate < 5%
        jobs_list_latency: ['p(95)<400'],
        health_check_latency: ['p(99)<200'],
    },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:5000';

// ─── Test Scenarios ──────────────────────────────────────────────
export default function () {
    // Scenario 1: Health Check (lightweight, should be < 50ms)
    const healthRes = http.get(`${BASE_URL}/`);
    healthLatency.add(healthRes.timings.duration);
    check(healthRes, {
        'health: status 200': (r) => r.status === 200,
        'health: body contains alive': (r) => r.json('status') === 'alive',
    }) || errorRate.add(1);

    // Scenario 2: List Jobs (the most common read endpoint)
    const jobsRes = http.get(`${BASE_URL}/api/jobs?page=1&limit=10`);
    jobsLatency.add(jobsRes.timings.duration);
    check(jobsRes, {
        'jobs: status 200': (r) => r.status === 200,
        'jobs: has data': (r) => r.json('success') === true,
        'jobs: returns array': (r) => Array.isArray(r.json('data.jobs')),
    }) || errorRate.add(1);

    // Scenario 3: Get single job (if jobs exist)
    const jobs = jobsRes.json('data.jobs');
    if (Array.isArray(jobs) && jobs.length > 0) {
        const jobId = jobs[0]._id;
        const singleJobRes = http.get(`${BASE_URL}/api/jobs/${jobId}`);
        check(singleJobRes, {
            'single job: status 200': (r) => r.status === 200,
        }) || errorRate.add(1);
    }

    // Scenario 4: Health endpoint with DB/Redis connectivity info
    const healthDetailRes = http.get(`${BASE_URL}/health`);
    check(healthDetailRes, {
        'health detail: status 200': (r) => r.status === 200,
        'health detail: status ok': (r) => r.json('status') === 'ok',
    }) || errorRate.add(1);

    // Scenario 5: 404 handler (verify it doesn't crash under load)
    const notFoundRes = http.get(`${BASE_URL}/api/nonexistent-route-${Date.now()}`);
    check(notFoundRes, {
        '404: returns 404 status': (r) => r.status === 404,
    }) || errorRate.add(1);

    sleep(0.5); // Throttle between iterations
}

export function handleSummary(data) {
    const p95 = data.metrics.http_req_duration.values['p(95)'];
    const p99 = data.metrics.http_req_duration.values['p(99)'];
    const rps = data.metrics.http_reqs.values.rate;
    const errors = data.metrics.errors?.values?.rate || 0;

    console.log('\n═══════════════════════════════════════════════');
    console.log('  OpusHire Load Test Results');
    console.log('═══════════════════════════════════════════════');
    console.log(`  Requests/sec:  ${rps.toFixed(1)}`);
    console.log(`  P95 Latency:   ${p95.toFixed(0)}ms`);
    console.log(`  P99 Latency:   ${p99.toFixed(0)}ms`);
    console.log(`  Error Rate:    ${(errors * 100).toFixed(2)}%`);
    console.log('═══════════════════════════════════════════════\n');

    return {};
}
