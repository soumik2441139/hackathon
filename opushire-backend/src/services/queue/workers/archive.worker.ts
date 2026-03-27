import { createWorker } from '../queue.service';
import JobModel from '../../../models/Job';
import BotStat from '../../../models/BotStat';
import { log } from '../../../utils/logger';
import axios from 'axios';

export function registerArchiveWorker() {
  createWorker('archive-check', async (data: { jobId: string }) => {
    const job = await JobModel.findById(data.jobId);
    if (!job || job.isArchived || job.source === 'manual') return { skipped: true };

    if (!job.externalUrl) {
      return { skipped: true, reason: 'No external URL to verify' };
    }

    try {
      // Robust link validation using generic axios configuration to ensure compatibility
      const res = await axios({
        method: 'head',
        url: job.externalUrl,
        headers: { 'User-Agent': 'OpusHire-GhostDetector/1.0' },
        timeout: 5000,
        validateStatus: () => true
      });

      if (res.status === 404 || res.status === 410) {
        job.isArchived = true;
        (job as any).archiveReason = 'Ghost position detected (404/410)';
        await job.save();
        
        await BotStat.incrementMetric('ghostJobsRemoved', 1);
        log('ARCHIVER', `Archived ghost job: ${job.title} at ${job.company}`);
        return { archived: true };
      }
      
      return { status: 'alive', code: res.status };
    } catch (err: any) {
      return { skipped: true, reason: 'Link check failed', error: err.message };
    }
  });
}
