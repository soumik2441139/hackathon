import { createWorker, enqueue } from '../queue.service';
import JobModel from '../../../models/Job';
import { buildStatusUpdate } from '../../../utils/stateMachine';
import { storeExample } from '../../rag/rag.service';
import { recordEpisode } from '../../memory/agent.memory';
import BotStat from '../../../models/BotStat';
import { safeGeminiCall } from '../../ai/gemini.client';
import { hallucinationsTotal, supervisorVerdicts } from '../../../metrics/business.metrics';

export function registerSuperviseWorker() {
  createWorker('supervise-tags', async (data: { jobId: string }) => {
    const job = await JobModel.findById(data.jobId);
    if (!job || job.tagTileStatus !== 'PENDING_REVIEW') return { skipped: true };

    const originalTags = job.longTagsToFix || job.tags.filter((t: string) => t.length > 25);
    const proposedTags = job.proposedTags || [];

    const prompt = `You are a strict QA bot. The original job requirements were:\n`
      + originalTags.join('\n')
      + `\n\nAnother bot extracted these concise keywords from them:\n`
      + proposedTags.join(', ')
      + `\n\nDo these keywords meaningfully relate to the original text without inventing fully fabricated new skills? Answer ONLY with YES or NO.`;

    const responseText = await safeGeminiCall(prompt);
    const isApproved = responseText.toUpperCase().includes('YES');

    if (isApproved) {
      await JobModel.updateOne({ _id: job._id }, {
        ...buildStatusUpdate('PENDING_REVIEW', 'READY_TO_APPLY', 'supervise-worker', { verifiedTags: proposedTags }),
        $unset: { longTagsToFix: '', proposedTags: '' },
      });

      await storeExample('fix-worker', originalTags.join(', '), proposedTags.join(', '));
      await recordEpisode('supervise-worker', 'approve-tags', originalTags.join(', '), `Approved: ${proposedTags.join(', ')}`, true);
      supervisorVerdicts.inc({ verdict: 'approve' });
      await enqueue('match-candidates', 'hunt', { jobId: job._id.toString() });
      return { status: 'READY_TO_APPLY' };
    }

    await JobModel.updateOne({ _id: job._id }, {
      ...buildStatusUpdate('PENDING_REVIEW', 'NEEDS_SHORTENING', 'supervise-worker'),
      $unset: { proposedTags: '' },
    });

    await BotStat.incrementMetric('hallucinationsCaught', 1);
    hallucinationsTotal.inc();
    supervisorVerdicts.inc({ verdict: 'reject' });

    await recordEpisode('supervise-worker', 'reject-tags', originalTags.join(', '), `Rejected: ${proposedTags.join(', ')}`, false);
    await recordEpisode('fix-worker', 'generate-keywords', originalTags.join(', '), `Rejected by supervisor`, false);

    await enqueue('fix-tags', 'fix', { jobId: data.jobId }, { attempts: 3, backoff: { type: 'exponential', delay: 5000 } });
    return { status: 'NEEDS_SHORTENING', reason: 'Hallucination rejected' };
  });
}
