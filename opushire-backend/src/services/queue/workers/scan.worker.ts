import { createWorker, enqueue } from '../queue.service';
import JobModel from '../../../models/Job';
import { buildStatusUpdate, type TagStatus } from '../../../utils/stateMachine';

export function registerScanWorker() {
  createWorker('scan-jobs', async (data: { jobId: string }) => {
    const job = await JobModel.findById(data.jobId);
    if (!job) return { skipped: true };

    const currentStatus = (job.tagTileStatus || 'OK') as TagStatus;
    if (['VETTED', 'NEEDS_SHORTENING', 'FAILED', 'READY_TO_APPLY', 'PENDING_REVIEW'].includes(currentStatus)) {
      return { skipped: true, reason: `Already in ${currentStatus}` };
    }

    if (!job.tags || job.tags.length === 0) {
      await JobModel.updateOne({ _id: job._id }, buildStatusUpdate('OK', 'VETTED', 'scan-worker'));
      return { status: 'VETTED', reason: 'No tags' };
    }

    const longTags = job.tags.filter((t: string) => t.length > 25 || t.split(' ').length > 3);

    if (longTags.length > 0) {
      await JobModel.updateOne({ _id: job._id }, buildStatusUpdate('OK', 'NEEDS_SHORTENING', 'scan-worker', { longTagsToFix: longTags }));
      await enqueue('fix-tags', 'fix', { jobId: data.jobId }, { attempts: 3, backoff: { type: 'exponential', delay: 5000 } });
      return { status: 'NEEDS_SHORTENING', flagged: longTags.length };
    }

    await JobModel.updateOne({ _id: job._id }, buildStatusUpdate('OK', 'VETTED', 'scan-worker'));
    return { status: 'VETTED' };
  });
}
