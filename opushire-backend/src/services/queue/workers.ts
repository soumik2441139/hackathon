import { probeRedis, startRegisteredWorkers } from './queue.service';
import { env } from '../../config/env';
import { log, logError } from '../../utils/logger';

import { autoLoadWorkers } from './workers/index';

let workersRegistered = false;
let workersStarted = false;
let initRetryTimer: ReturnType<typeof setTimeout> | null = null;
const INIT_RETRY_MS = Math.max(5000, Number(env.BULLMQ_INIT_RETRY_MS || '15000'));

function clearInitRetryTimer() {
  if (initRetryTimer) {
    clearTimeout(initRetryTimer);
    initRetryTimer = null;
  }
}

function scheduleWorkerInitRetry() {
  if (workersStarted || initRetryTimer) return;

  initRetryTimer = setTimeout(() => {
    initRetryTimer = null;
    initWorkers().catch((err) => logError('WORKERS', 'Retry init failed', err));
  }, INIT_RETRY_MS);

  log('WORKERS', `Scheduling BullMQ worker init retry in ${INIT_RETRY_MS}ms`);
}

export async function initWorkers(): Promise<void> {
  if (workersStarted) return;

  const available = await probeRedis();
  if (!available.primary) {
    log('WORKERS', 'Redis unavailable — BullMQ workers NOT started. The API will function without queue processing.');
    scheduleWorkerInitRetry();
    return;
  }

  if (!workersRegistered) {
    registerAllWorkers();
    workersRegistered = true;
  }

  const { primary, secondary } = startRegisteredWorkers();
  
  if (primary && secondary) {
    log('WORKERS', 'Multi-Redis strategy active: Primary and Secondary workers started.');
    workersStarted = true;
    clearInitRetryTimer();
  } else if (primary) {
    log('WORKERS', 'Single-Redis strategy active: Primary worker started.');
    workersStarted = true;
    clearInitRetryTimer();
  } else {
    log('WORKERS', 'Redis became reachable but workers did not start yet. Retrying initialization.');
    scheduleWorkerInitRetry();
  }
}

function registerAllWorkers() {
    autoLoadWorkers();
}

