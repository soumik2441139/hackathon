import { Queue, Worker, QueueEvents } from 'bullmq';
import { SystemConfig } from '../../config/system.config';
import { log, logError } from '../../utils/logger';

// ─── Redis Connection ────────────────────────────────────────────
// Azure Cache for Redis requires TLS. Support both local dev and production.

// Use any to bypass type conflicts between bullmq's ioredis and others
let sharedConnection: any;

function getConnection() {
  if (!sharedConnection) {
    // BullMQ uses ioredis internally. We use the same to ensure compatibility.
    // We require it here to avoid adding a direct dependency to package.json
    // which caused type conflicts previously.
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
let _redisAvailable: boolean | null = null;

/**
 * Probe Redis once so we know whether to bother creating queues.
 * Returns true if reachable, false otherwise.
 */
export async function probeRedis(): Promise<boolean> {
  if (_redisAvailable !== null) return _redisAvailable;
  try {
    // Create a temporary lightweight queue and try to ping
    const probe = new Queue('__probe__', { connection: getConnection() });
    await probe.client; // forces ioredis connect
    await probe.close();
    _redisAvailable = true;
    const conn = getConnection();
    log('REDIS', `Connected to ${conn.options.host}:${conn.options.port}`);
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
    const q = new Queue(name, { connection: getConnection() });
    queueMap.set(name, q);
    attachEvents(q);
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
  await q.add(jobName, data, opts);
}

// ─── Queue Event Logging ─────────────────────────────────────────

function attachEvents(queue: Queue) {
  const events = new QueueEvents(queue.name, { connection: getConnection() });
  events.on('completed', ({ jobId, returnvalue }) => {
    log('QUEUE', `Job ${jobId} completed on ${queue.name}`, { returnvalue });
  });
  events.on('failed', ({ jobId, failedReason }) => {
    logError('QUEUE', `Job ${jobId} failed on ${queue.name}: ${failedReason}`);
  });
}

// ─── Helper to create workers ────────────────────────────────────

export type ProcessorFn = (data: any) => Promise<any>;

export function createWorker(
  queueName: string,
  processor: ProcessorFn,
  opts: { concurrency?: number } = {},
): Worker | null {
  if (_redisAvailable === false) {
    log('WORKER', `Skipped worker for ${queueName} — Redis not available`);
    return null;
  }

  const worker = new Worker(
    queueName,
    async (job) => {
      log('WORKER', `Processing ${queueName} job ${job.id}`, { data: job.data });
      return processor(job.data);
    },
    {
      connection: getConnection(),
      concurrency: opts.concurrency || 1,
    },
  );

  worker.on('failed', (job, err) => {
    logError('WORKER', `${queueName} job ${job?.id} failed`, err);
  });

  return worker;
}

// ─── Graceful Shutdown ───────────────────────────────────────────

export async function closeQueues(): Promise<void> {
  log('QUEUE', 'Closing all queues...');
  const closeTasks: Promise<void>[] = [];
  for (const q of queueMap.values()) {
    closeTasks.push(q.close());
  }
  await Promise.all(closeTasks);
  queueMap.clear();
  log('QUEUE', 'All queues closed.');
}
