import { Queue, Worker, QueueEvents } from 'bullmq';
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
};

let sharedConnection: any = null;
let sharedQueue: Queue | null = null;
let sharedQueueEvents: QueueEvents | null = null;
let sharedWorker: Worker | null = null;

function getConnection(): any {
  if (!sharedConnection) {
    // BullMQ uses ioredis internally. We use the same to ensure compatibility.
    // We use any to avoid type conflicts between different ioredis versions.
    const IORedis = require('ioredis');
    sharedConnection = new IORedis({
      host: SystemConfig.redis.host,
      port: SystemConfig.redis.port,
      ...(SystemConfig.redis.password ? { password: SystemConfig.redis.password } : {}),
      ...(SystemConfig.redis.tls ? { tls: { servername: SystemConfig.redis.host, rejectUnauthorized: false } } : {}),
      maxRetriesPerRequest: null,
    });

    sharedConnection.on('error', (err: any) => {
      logError('REDIS', 'Shared connection error', err);
    });
  }
  return sharedConnection;
}

const PHYSICAL_QUEUE_NAME = process.env.BULLMQ_SHARED_QUEUE_NAME || 'opushire-jobs';
const JOB_NAME_SEPARATOR = '::';
const WORKER_CONCURRENCY = Math.max(1, Number(process.env.BULLMQ_WORKER_CONCURRENCY || '1'));
const ENABLE_QUEUE_EVENTS = process.env.BULLMQ_ENABLE_QUEUE_EVENTS === 'true';
const WORKERS_ENABLED = process.env.BULLMQ_WORKERS_ENABLED !== 'false';

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

function getSharedQueue(): Queue {
  if (!sharedQueue) {
    sharedQueue = new Queue(PHYSICAL_QUEUE_NAME, { connection: getConnection() });
    attachSharedEvents();
  }
  return sharedQueue;
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
] as const;

export type QueueName = (typeof QUEUE_NAMES)[number];

const queueMap = new Map<QueueName, Queue>();
const processorMap = new Map<QueueName, ProcessorFn>();
let _redisAvailable: boolean | null = null;

/**
 * Probe Redis once so we know whether to bother creating queues.
 * Returns true if reachable, false otherwise.
 */
export async function probeRedis(): Promise<boolean> {
  if (_redisAvailable !== null) return _redisAvailable;
  try {
    const conn = getConnection();
    // Use raw info command to check eviction policy
    const info = await conn.info('memory');
    if (info.includes('maxmemory_policy:volatile-lru') || info.includes('maxmemory_policy:allkeys-lru')) {
      logError('REDIS', 'CRITICAL: Redis eviction policy is NOT "noeviction". This may lead to BullMQ job loss!');
    } else {
      log('REDIS', 'Eviction policy is safe (noeviction)');
    }

    _redisAvailable = true;
    log('REDIS', `Connected to ${SystemConfig.redis.host}:${SystemConfig.redis.port}`);
  } catch (err) {
    _redisAvailable = false;
    logError('REDIS', `Redis unreachable — queue features disabled`, err);
  }
  return _redisAvailable;
}

/** Reset probe state (used in tests or after config change). */
export function resetRedisProbe() { _redisAvailable = null; }

/**
 * Get or create a Queue instance by name.
 * Returns null if Redis was probed and is unreachable.
 */
export function getQueue(name: QueueName): Queue | null {
  if (_redisAvailable === false) return null;

  if (!queueMap.has(name)) {
    // Logical queue aliases map to one shared physical BullMQ queue.
    const q = getSharedQueue();
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

export function startRegisteredWorkers(): Worker | null {
  if (!WORKERS_ENABLED) {
    log('WORKER', 'Shared worker disabled by BULLMQ_WORKERS_ENABLED=false');
    return null;
  }

  if (_redisAvailable === false) {
    log('WORKER', 'Skipped shared worker startup — Redis not available');
    return null;
  }

  if (sharedWorker) return sharedWorker;

  if (processorMap.size === 0) {
    log('WORKER', 'No processors registered; shared worker not started');
    return null;
  }

  sharedWorker = new Worker(
    PHYSICAL_QUEUE_NAME,
    async (job) => {
      const logicalQueue = parseLogicalQueueName(job.name);
      if (!logicalQueue) {
        throw new Error(`Unknown logical queue for job: ${job.name}`);
      }

      const processor = processorMap.get(logicalQueue);
      if (!processor) {
        throw new Error(`No processor registered for logical queue: ${logicalQueue}`);
      }

      log('WORKER', `Processing ${logicalQueue} job ${job.id}`, { jobName: job.name, data: job.data });
      return processor(job.data);
    },
    {
      connection: getConnection(),
      concurrency: WORKER_CONCURRENCY,
    },
  );

  sharedWorker.on('failed', (job, err) => {
    const logicalQueue = job ? parseLogicalQueueName(job.name) : null;
    logError('WORKER', `${logicalQueue || 'unknown'} job ${job?.id} failed`, err);
  });

  log('WORKER', `Shared BullMQ worker started on ${PHYSICAL_QUEUE_NAME} with concurrency=${WORKER_CONCURRENCY}`);
  return sharedWorker;
}

// ─── Graceful Shutdown ───────────────────────────────────────────

export async function closeQueues(): Promise<void> {
  log('QUEUE', 'Closing queue resources...');

  const closeTasks: Promise<void>[] = [];
  if (sharedWorker) {
    closeTasks.push(sharedWorker.close());
    sharedWorker = null;
  }

  if (sharedQueueEvents) {
    closeTasks.push(sharedQueueEvents.close());
    sharedQueueEvents = null;
  }

  if (sharedQueue) {
    closeTasks.push(sharedQueue.close());
    sharedQueue = null;
  }

  sharedConnection = null;

  await Promise.all(closeTasks);
  queueMap.clear();
  processorMap.clear();
  log('QUEUE', 'Queue resources closed.');
}
