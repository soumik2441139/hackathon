import mongoose from 'mongoose';
import {
  createWorker,
  probeRedis,
  enqueue,
} from './queue.service';
import { log, logError } from '../../utils/logger';
import JobModel from '../../models/Job';
import Resume from '../../models/Resume';
import { buildStatusUpdate, type TagStatus } from '../../utils/stateMachine';
import { getMatches } from '../matching/match.service';
import { generateCareerInsights } from '../advisor/careerAdvisor.service';
import { getExamples, buildFewShotSection, storeExample } from '../rag/rag.service';
import { recordEpisode, buildMemoryContext } from '../memory/agent.memory';

/**
 * Initialize all BullMQ workers.
 * Called after Redis probe — if Redis is down, this is a no-op.
 */
export async function initWorkers(): Promise<void> {
  const available = await probeRedis();
  if (!available) {
    log('WORKERS', 'Redis unavailable — BullMQ workers NOT started. The API will function without queue processing.');
    return;
  }

  registerAllWorkers();
  log('WORKERS', 'All BullMQ workers registered.');
}

function registerAllWorkers() {

// ─── Scan Worker ─────────────────────────────────────────────────

createWorker('scan-jobs', async (data: { jobId: string }) => {
  const job = await JobModel.findById(data.jobId);
  if (!job) return { skipped: true };

  const currentStatus = (job.tagTileStatus || 'OK') as TagStatus;
  if (['VETTED', 'NEEDS_SHORTENING', 'FAILED', 'READY_TO_APPLY', 'PENDING_REVIEW'].includes(currentStatus)) {
    return { skipped: true, reason: `Already in ${currentStatus}` };
  }

  if (!job.tags || job.tags.length === 0) {
    await JobModel.updateOne(
      { _id: job._id },
      buildStatusUpdate('OK', 'VETTED', 'scan-worker'),
    );
    return { status: 'VETTED', reason: 'No tags' };
  }

  const longTags = job.tags.filter((t: string) => t.length > 25 || t.split(' ').length > 3);

  if (longTags.length > 0) {
    await JobModel.updateOne(
      { _id: job._id },
      buildStatusUpdate('OK', 'NEEDS_SHORTENING', 'scan-worker', { longTagsToFix: longTags }),
    );
    // Chain: push to fix queue
    await enqueue('fix-tags', 'fix', { jobId: data.jobId }, { attempts: 3, backoff: { type: 'exponential', delay: 5000 } });
    return { status: 'NEEDS_SHORTENING', flagged: longTags.length };
  }

  await JobModel.updateOne(
    { _id: job._id },
    buildStatusUpdate('OK', 'VETTED', 'scan-worker'),
  );
  return { status: 'VETTED' };
});

// ─── Fix Worker ──────────────────────────────────────────────────
// Replaces bots/fixer/fix.js polling loop

createWorker('fix-tags', async (data: { jobId: string }) => {
  const job = await JobModel.findById(data.jobId);
  if (!job || job.tagTileStatus !== 'NEEDS_SHORTENING') return { skipped: true };

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not set');

  const longTags = (job as any).longTagsToFix || job.tags;
  const tagsText = longTags.join('\n');

  // RAG: get few-shot examples from past successful fixes
  const examples = await getExamples('fix-worker', tagsText, 3);
  const fewShot = buildFewShotSection(examples);

  // Agent Memory: inject learned rules and past experiences
  const memoryCtx = await buildMemoryContext('fix-worker', tagsText);

  const prompt = `Extract exactly 3 concise keywords (maximum 2 words each) from these required skills lines:\n`
    + tagsText
    + fewShot
    + memoryCtx
    + `\nReturn ONLY a comma-separated list of keywords, nothing else. Format: KEYWORD1, KEYWORD2, KEYWORD3`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    },
  );
  const result = await response.json();
  let text = result?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
  text = text.replace(/[*_]/g, '').replace(/\n/g, ', ');
  const newKeywords = text.split(',').map((k: string) => k.trim().toUpperCase()).filter(Boolean);

  if (newKeywords.length === 0) {
    await JobModel.updateOne(
      { _id: job._id },
      buildStatusUpdate('NEEDS_SHORTENING', 'FAILED', 'fix-worker'),
    );
    return { status: 'FAILED' };
  }

  const goodTags = job.tags.filter((t: string) => !(t.length > 25 || t.split(' ').length > 3));
  const finalTags = [...new Set([...goodTags, ...newKeywords])];

  await JobModel.updateOne(
    { _id: job._id },
    buildStatusUpdate('NEEDS_SHORTENING', 'PENDING_REVIEW', 'fix-worker', { proposedTags: finalTags }),
  );
  // Chain: push to supervise queue
  await enqueue('supervise-tags', 'review', { jobId: data.jobId }, { attempts: 3, backoff: { type: 'exponential', delay: 5000 } });
  return { status: 'PENDING_REVIEW', tags: finalTags };
});

// ─── Supervise Worker ────────────────────────────────────────────
// Replaces bots/supervisor/supervise.js polling loop

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

    // RAG: store this approved fix as a successful example for future reference
    await storeExample('fix-worker', originalTags.join(', '), proposedTags.join(', '));

    // Agent Memory: record successful QA review
    await recordEpisode(
      'supervise-worker',
      'approve-tags',
      originalTags.join(', '),
      `Approved: ${proposedTags.join(', ')}`,
      true,
    );

    return { status: 'READY_TO_APPLY' };
  }

  // Rejected → send back to fixer
  await JobModel.updateOne({ _id: job._id }, {
    ...buildStatusUpdate('PENDING_REVIEW', 'NEEDS_SHORTENING', 'supervise-worker'),
    $unset: { proposedTags: '' },
  });

  // Agent Memory: record rejection
  await recordEpisode(
    'supervise-worker',
    'reject-tags',
    originalTags.join(', '),
    `Rejected: ${proposedTags.join(', ')} — hallucination detected`,
    false,
  );
  // Also record for the fixer so it learns from rejections
  await recordEpisode(
    'fix-worker',
    'generate-keywords',
    originalTags.join(', '),
    `Rejected by supervisor: ${proposedTags.join(', ')}`,
    false,
  );

  await enqueue('fix-tags', 'fix', { jobId: data.jobId }, { attempts: 3, backoff: { type: 'exponential', delay: 5000 } });
  return { status: 'NEEDS_SHORTENING', reason: 'Hallucination rejected' };
});

// ─── Cleanup Worker ──────────────────────────────────────────────

createWorker('cleanup-jobs', async () => {
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const threeWeeksAgo = new Date(now.getTime() - 21 * 24 * 60 * 60 * 1000);

  const deleted = await JobModel.deleteMany({ createdAt: { $lt: threeWeeksAgo } });
  const archived = await JobModel.updateMany(
    { createdAt: { $lt: oneWeekAgo, $gte: threeWeeksAgo }, isArchived: { $ne: true } },
    { $set: { isArchived: true } },
  );

  return { deleted: deleted.deletedCount, archived: archived.modifiedCount };
});

// ─── Match Worker ────────────────────────────────────────────────

createWorker('match-resumes', async (data: { resumeId: string }) => {
  const resume = await Resume.findById(data.resumeId);
  if (!resume || !resume.parsedData || resume.matched) return { skipped: true };

  const matches = await getMatches(resume.rawText, resume.parsedData);
  resume.matches = matches;
  resume.matched = true;
  await resume.save();

  // Chain: push to advisor queue
  await enqueue('career-advisor', 'advise', { resumeId: data.resumeId });
  return { matched: matches.length };
});

// ─── Advisor Worker ──────────────────────────────────────────────

createWorker('career-advisor', async (data: { resumeId: string }) => {
  const resume = await Resume.findById(data.resumeId);
  if (!resume || !resume.matched) return { skipped: true };
  if (resume.extraData?.learningPath) return { skipped: true, reason: 'Already advised' };

  const insights = await generateCareerInsights(resume);
  if (!insights) return { noInsights: true };

  resume.extraData = resume.extraData || {};
  resume.extraData.skillGaps = insights.gaps;
  resume.extraData.learningPath = insights.learningPath;
  resume.markModified('extraData');
  await resume.save();

  return { advised: true };
});

} // end registerAllWorkers
