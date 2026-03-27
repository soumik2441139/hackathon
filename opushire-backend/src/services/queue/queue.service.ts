import { Queue, Worker, QueueEvents } from 'bullmq';
import IORedis from 'ioredis';
import { env } from '../../config/env';
import { SystemConfig } from '../../config/system.config';
import { log, logError } from '../../utils/logger';

// ─── Redis Connection ────────────────────────────────────────────
// Azure Cache for Redis requires TLS. Support both local dev and production.

type RedisConnectionOptions = {
  host: string;
  port: number;
  password?: string;
  tls?: { servername: string; rejectUnauthorized: boolean };
  maxRetriesPerRequest: null;
  enableOfflineQueue: boolean;
  connectionName: string;
  retryStrategy?: (times: number) => number;
  reconnectOnError?: (err: Error) => boolean;
};

type RedisBaseConfig = {
  host: string;
  port: number;
  password?: string;
  tls: boolean;
};

let sharedConnection: any = null;
let secondaryConnection: any = null;
let tertiaryConnection: any = null;
let sharedQueue: Queue | null = null;
let secondaryQueue: Queue | null = null;
let tertiaryQueue: Queue | null = null;
let sharedQueueEvents: QueueEvents | null = null;
let sharedWorker: Worker | null = null;
let secondaryWorker: Worker | null = null;
let tertiaryWorker: Worker | null = null;

function buildRedisOptions(
  config: RedisBaseConfig,
  connectionName: string,
  target: 'producer' | 'worker',
): RedisConnectionOptions {
  return {
    host: config.host,
    port: config.port,
    ...(config.password ? { password: config.password } : {}),
    ...(config.tls ? { tls: { servername: config.host, rejectUnauthorized: false } } : {}),
    maxRetriesPerRequest: null,
    // Producers fail fast; workers should recover through reconnects.
    enableOfflineQueue: target === 'worker',
    connectionName,
    // Enterprise Pattern: Exponential Backoff Reconnection & Circuit Awareness
    retryStrategy: (times: number) => Math.min(times * 100, 3000),
    reconnectOnError: (err: Error) => true,
  };
}

function getWorkerConnectionOptions(isSecondary = false): RedisConnectionOptions {
  if (isSecondary && !SystemConfig.redisSecondary) {
    return getWorkerConnectionOptions(false);
  }

  if (isSecondary) {
    return buildRedisOptions(SystemConfig.redisSecondary!, 'bullmq-secondary-worker', 'worker');
  }

  return buildRedisOptions(SystemConfig.redis, 'bullmq-primary-worker', 'worker');
}

function getConnection(isSecondary = false): any {
  if (isSecondary && !SystemConfig.redisSecondary) {
    // Fallback to primary if secondary not configured
    return getConnection(false);
  }

  if (isSecondary) {
    if (!secondaryConnection) {
      const config = SystemConfig.redisSecondary!;
      secondaryConnection = new IORedis(buildRedisOptions(config, 'bullmq-secondary', 'producer'));
      secondaryConnection.on('error', (err: any) => logError('REDIS_SECONDARY', 'Connection error', err));
    }
    return secondaryConnection;
  }

  if (!sharedConnection) {
    sharedConnection = new IORedis(buildRedisOptions(SystemConfig.redis, 'bullmq-primary', 'producer'));
    sharedConnection.on('error', (err: any) => logError('REDIS_PRIMARY', 'Connection error', err));
  }
  return sharedConnection;
}

function getTertiaryConnectionOptions(target: 'producer' | 'worker') {
  return {
    connectionName: target === 'worker' ? 'bullmq-tertiary-worker' : 'bullmq-tertiary',
    maxRetriesPerRequest: null,
    enableOfflineQueue: target === 'worker',
    retryStrategy: (times: number) => Math.min(times * 100, 3000),
    reconnectOnError: (err: Error) => true,
  };
}

function getTertiaryConnection(): any {
  if (!SystemConfig.redisTertiaryUrl) return getConnection(false); // fallback to primary
  if (!tertiaryConnection) {
    tertiaryConnection = new IORedis(SystemConfig.redisTertiaryUrl, getTertiaryConnectionOptions('producer'));
    tertiaryConnection.on('error', (err: any) => logError('REDIS_TERTIARY', 'Connection error', err));
  }
  return tertiaryConnection;
}

const PHYSICAL_QUEUE_NAME = env.BULLMQ_SHARED_QUEUE_NAME;
const JOB_NAME_SEPARATOR = '::';
const WORKER_CONCURRENCY = Math.max(1, Number(env.BULLMQ_WORKER_CONCURRENCY || '1'));
const ENABLE_QUEUE_EVENTS = env.BULLMQ_ENABLE_QUEUE_EVENTS === 'true';
const WORKERS_ENABLED = env.BULLMQ_WORKERS_ENABLED !== 'false';

function buildLogicalJobName(queueName: QueueName, jobName: string): string {
  return `${queueName}${JOB_NAME_SEPARATOR}${jobName}`;
}

function parseLogicalQueueName(fullJobName: string): QueueName | null {
  const idx = fullJobName.indexOf(JOB_NAME_SEPARATOR);
  const logicalQueue = idx >= 0 ? fullJobName.slice(0, idx) : fullJobName;
  if ((QUEUE_NAMES as readonly string[]).includes(logicalQueue)) {
    return logicalQueue as QueueName;
  }
  return null;
}

function getSharedQueue(isSecondary = false): Queue {
  // Enterprise Pattern: Strict limits to prevent Database RAM overflow on Free Tiers
  const defaultJobOptions = {
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 300 },
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 }
  };

  if (isSecondary) {
    if (!secondaryQueue) {
      secondaryQueue = new Queue(PHYSICAL_QUEUE_NAME, { 
        connection: getConnection(true),
        defaultJobOptions 
      });
    }
    return secondaryQueue;
  }

  if (!sharedQueue) {
    sharedQueue = new Queue(PHYSICAL_QUEUE_NAME, { 
      connection: getConnection(false),
      defaultJobOptions 
    });
    attachSharedEvents();
  }
  return sharedQueue;
}

function getTertiaryQueue(): Queue {
  if (!SystemConfig.redisTertiaryUrl) return getSharedQueue(false);
  if (!tertiaryQueue) {
    tertiaryQueue = new Queue(PHYSICAL_QUEUE_NAME, { 
      connection: getTertiaryConnection(),
      defaultJobOptions: {
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 300 },
        attempts: 5,
        backoff: { type: 'exponential', delay: 1000 }
      }
    });
  }
  return tertiaryQueue;
}

function attachSharedEvents() {
  if (!ENABLE_QUEUE_EVENTS || sharedQueueEvents) return;
  sharedQueueEvents = new QueueEvents(PHYSICAL_QUEUE_NAME, { connection: getConnection() });
  sharedQueueEvents.on('completed', ({ jobId, returnvalue }) => {
    log('QUEUE', `Job ${jobId} completed on ${PHYSICAL_QUEUE_NAME}`, { returnvalue });
  });
  sharedQueueEvents.on('failed', ({ jobId, failedReason }) => {
    logError('QUEUE', `Job ${jobId} failed on ${PHYSICAL_QUEUE_NAME}: ${failedReason}`);
  });
}

function attachWorkerEvents(worker: Worker, scope: 'WORKER_PRIMARY' | 'WORKER_SECONDARY' | 'WORKER_TERTIARY') {
  worker.on('error', (err) => {
    logError(scope, 'Worker runtime error', err);
  });

  worker.on('failed', (job, err) => {
    const id = job?.id ?? 'unknown';
    logError(scope, `Worker job ${id} failed`, err);
  });
}

// ─── Lazy Queue Registry ─────────────────────────────────────────
// Queues are created lazily on first use so the server boots even
// when Redis is down. Only queue operations fail, not the HTTP API.

const QUEUE_NAMES = [
  'scan-jobs',
  'fix-tags',
  'supervise-tags',
  'cleanup-jobs',
  'archive-check',
  'match-resumes',
  'career-advisor',
  'linkedin-enrich',
  'match-candidates',
  'email-notifications',
] as const;

export type QueueName = (typeof QUEUE_NAMES)[number];

const queueMap = new Map<QueueName, Queue>();
const processorMap = new Map<QueueName, ProcessorFn>();
let _redisAvailable: boolean | null = null;
let _secondaryRedisAvailable: boolean | null = null;

/**
 * Probe Redis once so we know whether to bother creating queues.
 * Returns true if reachable, false otherwise.
 */
export async function probeRedis(): Promise<{ primary: boolean; secondary: boolean }> {
  const result = { primary: false, secondary: false };
  
  try {
    const primary = getConnection(false);
    await primary.ping();
    result.primary = true;
  } catch (err: any) {
    // If Redis is unreachable and offline queue is disabled, ioredis throws "Stream isn't writeable".
    // We catch this here so the health check returns 'false' instead of crashing with a stack trace.
    const isOfflineError = err.message?.includes("Stream isn't writeable");
    if (isOfflineError) {
      log('REDIS_PRIMARY', 'Unreachable (Stream not writeable)');
    } else {
      logError('REDIS_PRIMARY', 'Unreachable', err);
    }
  }

  if (SystemConfig.redisSecondary) {
    try {
      const secondary = getConnection(true);
      await secondary.ping();
      result.secondary = true;
    } catch (err: any) {
      const isOfflineError = err.message?.includes("Stream isn't writeable");
      if (isOfflineError) {
        log('REDIS_SECONDARY', 'Unreachable (Stream not writeable)');
      } else {
        logError('REDIS_SECONDARY', 'Unreachable', err);
      }
    }
  } else {
    // If not configured, we consider it "null" or skip, but for the health check 'false' is fine
    result.secondary = false;
  }

  _redisAvailable = result.primary; // Keep legacy flag for basic operational guard
  _secondaryRedisAvailable = SystemConfig.redisSecondary ? result.secondary : null;
  return result;
}

/** Reset probe state (used in tests or after config change). */
export function resetRedisProbe() {
  _redisAvailable = null;
  _secondaryRedisAvailable = null;
}

/**
 * Get or create a Queue instance by name.
 * Returns null if Redis was probed and is unreachable.
 */
export function getQueue(name: QueueName): Queue | null {
  if (_redisAvailable === false) return null;

  if (!queueMap.has(name)) {
    // Routing Logic: Specific heavy queues go to secondary (Upstash), core logic goes to tertiary (Render)
    const isCore = ['match-resumes', 'career-advisor', 'email-notifications'].includes(name);
    const isHeavy = ['scan-jobs', 'fix-tags', 'supervise-tags', 'linkedin-enrich', 'match-candidates'].includes(name);
    
    const useTertiary = isCore && !!SystemConfig.redisTertiaryUrl;
    const useSecondary = isHeavy && !!SystemConfig.redisSecondary && _secondaryRedisAvailable !== false;

    let q: Queue;
    if (useTertiary) {
      q = getTertiaryQueue();
    } else if (useSecondary) {
      q = getSharedQueue(true);
    } else {
      q = getSharedQueue(false);
    }
    
    queueMap.set(name, q);
  }
  return queueMap.get(name)!;
}

// ─── Convenience Accessors ───────────────────────────────────────
// These replace the old module-level exports. Each returns Queue | null.

export const scanQueue    = () => getQueue('scan-jobs');
export const fixQueue     = () => getQueue('fix-tags');
export const superviseQueue = () => getQueue('supervise-tags');
export const cleanupQueue = () => getQueue('cleanup-jobs');
export const archiveQueue = () => getQueue('archive-check');
export const matchQueue   = () => getQueue('match-resumes');
export const advisorQueue = () => getQueue('career-advisor');
export const enrichQueue  = () => getQueue('linkedin-enrich');
export const matchCandidatesQueue = () => getQueue('match-candidates');
export const emailNotificationsQueue = () => getQueue('email-notifications');

// ─── Safe enqueue helper ─────────────────────────────────────────
// Wraps queue.add() — silently skips if Redis is unavailable.

export async function enqueue(
  name: QueueName,
  jobName: string,
  data: Record<string, any>,
  opts: Record<string, any> = {},
): Promise<void> {
  const q = getQueue(name);
  if (!q) {
    log('QUEUE', `Skipped enqueue to ${name} — Redis not available`);
    return;
  }
  await q.add(buildLogicalJobName(name, jobName), data, opts);
}

// ─── Helper to create workers ────────────────────────────────────

export type ProcessorFn = (data: any) => Promise<any>;

export function createWorker(
  queueName: QueueName,
  processor: ProcessorFn,
  opts: { concurrency?: number } = {},
): Worker | null {
  if (!WORKERS_ENABLED) {
    log('WORKER', `Skipping processor registration for ${queueName} — workers disabled by BULLMQ_WORKERS_ENABLED=false`);
    return null;
  }

  if (_redisAvailable === false) {
    log('WORKER', `Skipped worker for ${queueName} — Redis not available`);
    return null;
  }

  if (opts.concurrency && opts.concurrency > 1) {
    log('WORKER', `Ignoring per-queue concurrency for ${queueName}; using shared worker concurrency ${WORKER_CONCURRENCY}`);
  }

  processorMap.set(queueName, processor);
  return sharedWorker;
}

export function startRegisteredWorkers(): any {
  const result = { primary: null as Worker | null, secondary: null as Worker | null, tertiary: null as Worker | null };

  if (!WORKERS_ENABLED || _redisAvailable === false) return result;

  // Separate processors by target instance
  const primaryProcessors = new Map<QueueName, ProcessorFn>();
  const secondaryProcessors = new Map<QueueName, ProcessorFn>();
  const tertiaryProcessors = new Map<QueueName, ProcessorFn>();
  
  const canUseSecondary = !!SystemConfig.redisSecondary && _secondaryRedisAvailable === true;
  const canUseTertiary = !!SystemConfig.redisTertiaryUrl;

  for (const [name, proc] of processorMap.entries()) {
    const isCore = ['match-resumes', 'career-advisor', 'email-notifications'].includes(name);
    const isHeavy = ['scan-jobs', 'fix-tags', 'supervise-tags', 'linkedin-enrich', 'match-candidates'].includes(name);
    
    if (isCore && canUseTertiary) {
      tertiaryProcessors.set(name, proc);
    } else if (isHeavy && canUseSecondary) {
      secondaryProcessors.set(name, proc);
    } else {
      primaryProcessors.set(name, proc);
    }
  }

  // Start Primary Worker
  if (primaryProcessors.size > 0 && !sharedWorker) {
    sharedWorker = new Worker(PHYSICAL_QUEUE_NAME, async (job) => {
      const logicalQueue = parseLogicalQueueName(job.name);
      const processor = logicalQueue ? primaryProcessors.get(logicalQueue) : null;
      if (!processor) throw new Error(`No primary processor for ${job.name}`);
      return processor(job.data);
    }, {
      connection: getWorkerConnectionOptions(false),
      concurrency: WORKER_CONCURRENCY,
    });
    attachWorkerEvents(sharedWorker, 'WORKER_PRIMARY');
    result.primary = sharedWorker;
    log('WORKER', `Primary worker started on ${PHYSICAL_QUEUE_NAME}`);
  }

  // Start Secondary Worker
  if (secondaryProcessors.size > 0 && !secondaryWorker) {
    secondaryWorker = new Worker(PHYSICAL_QUEUE_NAME, async (job) => {
      const logicalQueue = parseLogicalQueueName(job.name);
      const processor = logicalQueue ? secondaryProcessors.get(logicalQueue) : null;
      if (!processor) throw new Error(`No secondary processor for ${job.name}`);
      return processor(job.data);
    }, {
      connection: getWorkerConnectionOptions(true),
      concurrency: WORKER_CONCURRENCY,
    });
    attachWorkerEvents(secondaryWorker, 'WORKER_SECONDARY');
    result.secondary = secondaryWorker;
    log('WORKER', `Secondary worker started on ${PHYSICAL_QUEUE_NAME} (Heavy jobs)`);
  }

  // Start Tertiary Worker
  if (tertiaryProcessors.size > 0 && !tertiaryWorker) {
    tertiaryWorker = new Worker(PHYSICAL_QUEUE_NAME, async (job) => {
      const logicalQueue = parseLogicalQueueName(job.name);
      const processor = logicalQueue ? tertiaryProcessors.get(logicalQueue) : null;
      if (!processor) throw new Error(`No tertiary processor for ${job.name}`);
      return processor(job.data);
    }, {
      connection: new IORedis(SystemConfig.redisTertiaryUrl!, getTertiaryConnectionOptions('worker')) as any,
      concurrency: WORKER_CONCURRENCY,
    });
    attachWorkerEvents(tertiaryWorker, 'WORKER_TERTIARY');
    result.tertiary = tertiaryWorker;
    log('WORKER', `Tertiary worker started on ${PHYSICAL_QUEUE_NAME} (Core jobs)`);
  }

  return result;
}

// ─── Graceful Shutdown ───────────────────────────────────────────

export async function closeQueues(): Promise<void> {
  log('QUEUE', 'Closing queue resources...');

  const closeTasks: Promise<void>[] = [];
  if (sharedWorker) {
    closeTasks.push(sharedWorker.close());
    sharedWorker = null;
  }

  if (secondaryWorker) {
    closeTasks.push(secondaryWorker.close());
    secondaryWorker = null;
  }

  if (sharedQueueEvents) {
    closeTasks.push(sharedQueueEvents.close());
    sharedQueueEvents = null;
  }

  if (sharedQueue) {
    closeTasks.push(sharedQueue.close());
    sharedQueue = null;
  }

  if (secondaryQueue) {
    closeTasks.push(secondaryQueue.close());
    secondaryQueue = null;
  }

  if (tertiaryWorker) {
    closeTasks.push(tertiaryWorker.close());
    tertiaryWorker = null;
  }

  if (tertiaryQueue) {
    closeTasks.push(tertiaryQueue.close());
    tertiaryQueue = null;
  }

  await Promise.all(closeTasks);
  queueMap.clear();
  processorMap.clear();

  // Explicitly disconnect IORedis clients so TCP sockets are released immediately.
  // Without this, the OS eventually closes them but Redis Cloud counts them until then.
  const disconnectTasks: Promise<void>[] = [];
  if (sharedConnection) {
    disconnectTasks.push(Promise.resolve(sharedConnection.disconnect()));
    sharedConnection = null;
  }
  if (secondaryConnection) {
    disconnectTasks.push(Promise.resolve(secondaryConnection.disconnect()));
    secondaryConnection = null;
  }
  if (tertiaryConnection) {
    disconnectTasks.push(Promise.resolve(tertiaryConnection.disconnect()));
    tertiaryConnection = null;
  }
  await Promise.allSettled(disconnectTasks);

  log('QUEUE', 'Queue resources closed.');
}
