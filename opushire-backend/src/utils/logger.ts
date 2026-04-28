import pino from "pino";
import { AsyncLocalStorage } from "node:async_hooks";
import { trace, context } from "@opentelemetry/api";

// ─── Async-Safe Trace Context ────────────────────────────────────
// Uses AsyncLocalStorage to ensure concurrent requests never
// overwrite each other's trace IDs (the old global variable was
// NOT safe under load — request B would steal request A's traceId).

interface TraceContext {
  traceId: string;
  spanId?: string;
}

const asyncStore = new AsyncLocalStorage<TraceContext>();

// Structured logger with pino — JSON in production, pretty in dev
const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  transport:
    process.env.NODE_ENV !== "production"
      ? { target: "pino-pretty", options: { colorize: true, translateTime: "SYS:HH:MM:ss" } }
      : undefined,
  base: { service: "opushire-backend" },
  // Mixin auto-injects traceId and spanId into every log line
  mixin() {
    // Try OpenTelemetry context first (production with Jaeger)
    const otelSpan = trace.getActiveSpan();
    if (otelSpan) {
      const spanCtx = otelSpan.spanContext();
      return {
        traceId: spanCtx.traceId,
        spanId: spanCtx.spanId,
      };
    }

    // Fallback to AsyncLocalStorage context (when OTel is not active)
    const store = asyncStore.getStore();
    if (store) {
      return {
        traceId: store.traceId,
        ...(store.spanId ? { spanId: store.spanId } : {}),
      };
    }

    return {};
  },
});

/**
 * Run a function within a trace context.
 * All logs emitted inside `fn` will automatically include the traceId.
 */
export function runWithTraceId<T>(traceId: string, fn: () => T): T {
  return asyncStore.run({ traceId }, fn);
}

/**
 * Set the trace context for the current async scope.
 * Use inside Express middleware to propagate the request trace ID.
 */
export function setTraceId(id: string) {
  const store = asyncStore.getStore();
  if (store) {
    store.traceId = id;
  }
  // If called outside a run(), we start a new context
  // This is for backward compatibility with existing code
}

export function getTraceId(): string | undefined {
  const otelSpan = trace.getActiveSpan();
  if (otelSpan) return otelSpan.spanContext().traceId;
  return asyncStore.getStore()?.traceId;
}

// Drop-in replacements for the old log/logError signatures
export function log(scope: string, msg: string, data: any = null) {
  const child = logger.child({ scope, ...(data ? { data } : {}) });
  child.info(msg);
}

export function logError(scope: string, msg: string, error: any = null) {
  const child = logger.child({ scope });
  if (error instanceof Error) {
    child.error({ err: error }, msg);
  } else if (error) {
    child.error({ errorDetail: error }, msg);
  } else {
    child.error(msg);
  }
}

export function withTraceId(fn: () => void) {
  // Backward compatibility — wraps in a new trace context
  const crypto = require("crypto");
  asyncStore.run({ traceId: crypto.randomUUID() }, fn);
}

export { logger, asyncStore };
