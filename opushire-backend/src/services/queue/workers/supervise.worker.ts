import { createWorker, enqueue } from '../queue.service';
import JobModel from '../../../models/Job';
import { buildStatusUpdate } from '../../../utils/stateMachine';
import { storeExample } from '../../rag/rag.service';
import { recordEpisode } from '../../memory/agent.memory';

export function registerSuperviseWorker() {
  createWorker('supervise-tags', async (data: { jobId: string }) => {
    const job = await JobModel.findById(data.jobId);
    if (!job || job.tagTileStatus !== 'PENDING_REVIEW') return { skipped: true };

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error('GROQ_API_KEY not set');

    const originalTags = (job as any).longTagsToFix || job.tags.filter((t: string) => t.length > 25);
    const proposedTags = (job as any).proposedTags || [];

    const prompt = `You are a strict QA bot. The original job requirements were:\n`
      + originalTags.join('\n')
      + `\n\nAnother bot summarized these into the following keywords:\n`
      + proposedTags.join(', ')
      + `\n\nAre these proposed keywords an accurate representation? Answer ONLY with YES or NO.`;

    const response = await fetch(`https://api.groq.com/openai/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages: [{ role: 'user', content: prompt }] }),
    });
    
    const result = await response.json();
    const isApproved = result?.choices?.[0]?.message?.content?.trim().toUpperCase().includes('YES');

    if (isApproved) {
      await JobModel.updateOne({ _id: job._id }, {
        ...buildStatusUpdate('PENDING_REVIEW', 'READY_TO_APPLY', 'supervise-worker', { verifiedTags: proposedTags }),
        $unset: { longTagsToFix: '', proposedTags: '' },
      });

      await storeExample('fix-worker', originalTags.join(', '), proposedTags.join(', '));
      await recordEpisode('supervise-worker', 'approve-tags', originalTags.join(', '), `Approved: ${proposedTags.join(', ')}`, true);
      
      await enqueue('match-candidates', 'hunt', { jobId: job._id.toString() });
      return { status: 'READY_TO_APPLY' };
    }

    await JobModel.updateOne({ _id: job._id }, {
      ...buildStatusUpdate('PENDING_REVIEW', 'NEEDS_SHORTENING', 'supervise-worker'),
      $unset: { proposedTags: '' },
    });

    await recordEpisode('supervise-worker', 'reject-tags', originalTags.join(', '), `Rejected: ${proposedTags.join(', ')}`, false);
    await recordEpisode('fix-worker', 'generate-keywords', originalTags.join(', '), `Rejected by supervisor`, false);

    await enqueue('fix-tags', 'fix', { jobId: data.jobId }, { attempts: 3, backoff: { type: 'exponential', delay: 5000 } });
    return { status: 'NEEDS_SHORTENING', reason: 'Hallucination rejected' };
  });
}
