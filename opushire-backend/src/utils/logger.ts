import pino from "pino";
import crypto from "crypto";

// Structured logger with pino — JSON in production, pretty in dev
const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  transport:
    process.env.NODE_ENV !== "production"
      ? { target: "pino-pretty", options: { colorize: true, translateTime: "SYS:HH:MM:ss" } }
      : undefined,
  base: { service: "opushire-backend" },
});

// Async-local trace ID support via a simple context holder
let _traceId: string | undefined;

export function withTraceId(fn: () => void) {
  _traceId = crypto.randomUUID();
  try {
    fn();
  } finally {
    _traceId = undefined;
  }
}

export function setTraceId(id: string) {
  _traceId = id;
}

export function getTraceId(): string | undefined {
  return _traceId;
}

// Drop-in replacements for the old log/logError signatures
export function log(scope: string, msg: string, data: any = null) {
  const child = logger.child({ scope, ...(data ? { data } : {}), ...(_traceId ? { traceId: _traceId } : {}) });
  child.info(msg);
}

export function logError(scope: string, msg: string, error: any = null) {
  const child = logger.child({ scope, ...(_traceId ? { traceId: _traceId } : {}) });
  if (error instanceof Error) {
    child.error({ err: error }, msg);
  } else if (error) {
    child.error({ errorDetail: error }, msg);
  } else {
    child.error(msg);
  }
}

export { logger };
