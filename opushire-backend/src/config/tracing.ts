/**
 * OpenTelemetry Tracing Configuration
 *
 * MUST be imported BEFORE all other modules in server.ts.
 * Initializes the OTel SDK with auto-instrumentation for:
 *   - Express (HTTP spans)
 *   - IORedis (Redis command spans)
 *   - MongoDB (query spans)
 *
 * Exports traces to Jaeger (Docker) or console (dev fallback).
 *
 * @see https://opentelemetry.io/docs/languages/js/getting-started/nodejs/
 */

import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';

const OTEL_ENDPOINT = process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318';

const traceExporter = new OTLPTraceExporter({
  url: `${OTEL_ENDPOINT}/v1/traces`,
});

const resource = resourceFromAttributes({
  [ATTR_SERVICE_NAME]: process.env.OTEL_SERVICE_NAME || 'opushire-backend',
  [ATTR_SERVICE_VERSION]: '1.0.0',
  'deployment.environment': process.env.NODE_ENV || 'development',
});

const sdk = new NodeSDK({
  resource,
  traceExporter,
  instrumentations: [
    getNodeAutoInstrumentations({
      // Suppress noisy FS spans from pino / module loading
      '@opentelemetry/instrumentation-fs': { enabled: false },
      // DNS lookup spans add noise without insight
      '@opentelemetry/instrumentation-dns': { enabled: false },
      // Auto-instrument Express, IORedis, MongoDB, HTTP
      '@opentelemetry/instrumentation-express': { enabled: true },
      '@opentelemetry/instrumentation-ioredis': { enabled: true },
      '@opentelemetry/instrumentation-mongodb': { enabled: true },
      '@opentelemetry/instrumentation-http': { enabled: true },
    }),
  ],
});

// Start the SDK — this MUST happen before Express is imported
sdk.start();

// Graceful shutdown on SIGTERM — flushes pending traces
process.on('SIGTERM', () => {
  sdk.shutdown()
    .then(() => console.log('OpenTelemetry SDK shut down'))
    .catch((err) => console.error('Error shutting down OTel SDK', err));
});

export { sdk };
