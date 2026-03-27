import { registerScanWorker } from './scan.worker';
import { registerFixWorker } from './fix.worker';
import { registerSuperviseWorker } from './supervise.worker';
import { registerCleanupWorker } from './cleanup.worker';
import { registerMatchWorker } from './match.worker';
import { registerAdvisorWorker } from './advisor.worker';
import { registerEmailWorker } from './email.worker';
import { registerArchiveWorker } from './archive.worker';

export function autoLoadWorkers() {
    registerScanWorker();
    registerFixWorker();
    registerSuperviseWorker();
    registerCleanupWorker();
    registerMatchWorker();
    registerAdvisorWorker();
    registerEmailWorker();
    registerArchiveWorker();
}
