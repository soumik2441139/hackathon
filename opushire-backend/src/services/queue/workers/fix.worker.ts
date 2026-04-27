import { createWorker, enqueue } from '../queue.service';
import JobModel from '../../../models/Job';
import { safeGeminiCall } from '../../ai/gemini.client';
import { logError } from '../../../utils/logger';
import { buildStatusUpdate } from '../../../utils/stateMachine';
import { getExamples, buildFewShotSection } from '../../rag/rag.service';
import { buildMemoryContext } from '../../memory/agent.memory';
import axios from 'axios';

const FIXER_STOP_WORDS = new Set([
  'and', 'or', 'the', 'with', 'for', 'from', 'into', 'onto', 'your', 'you', 'our', 'their',
  'that', 'this', 'these', 'those', 'have', 'has', 'had', 'will', 'can', 'must', 'should',
  'ability', 'required', 'requirements', 'requirement', 'skills', 'skill', 'experience',
  'knowledge', 'strong', 'good', 'working', 'using', 'use', 'plus', 'preferred', 'nice',
  'to', 'of', 'in', 'on', 'at', 'by', 'as', 'an', 'a', 'is', 'are', 'be'
]);

export function parseKeywordList(text: string): string[] {
  return text.replace(/[*_]/g, '').replace(/\n/g, ', ').split(',')
    .map((k: string) => k.replace(/[^a-zA-Z0-9+#\s]/g, ' ').replace(/\s+/g, ' ').trim().toUpperCase())
    .filter(Boolean).slice(0, 3);
}

export function extractFallbackKeywords(lines: string[]): string[] {
  const counts = new Map<string, number>();
  for (const line of lines || []) {
    const words = String(line || '').toLowerCase().replace(/[^a-z0-9+#\s]/g, ' ').split(/\s+/).filter(Boolean);
    for (const word of words) {
      if (word.length >= 3 && !FIXER_STOP_WORDS.has(word)) {
        counts.set(word, (counts.get(word) || 0) + 1);
      }
    }
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([word]) => word.toUpperCase());
}

export function registerFixWorker() {
  createWorker('fix-tags', async (data: { jobId: string }) => {
    const job = await JobModel.findById(data.jobId);
    if (!job || job.tagTileStatus !== 'NEEDS_SHORTENING') return { skipped: true };


    const longTags = (job.longTagsToFix || job.tags || []) as string[];
    const tagsText = longTags.join('\n');

    const examples = await getExamples('fix-worker', tagsText, 3);
    const fewShot = buildFewShotSection(examples);
    const memoryCtx = await buildMemoryContext('fix-worker', tagsText);

    const prompt = `Extract exactly 3 concise keywords (maximum 2 words each) from these required skills lines:\n`
      + tagsText + fewShot + memoryCtx
      + `\nReturn ONLY a comma-separated list of keywords, nothing else. Format: KEYWORD1, KEYWORD2, KEYWORD3`;

    let newKeywords: string[] = [];
    let keywordSource: 'ai' | 'fallback' = 'ai';

    try {
      const text = await safeGeminiCall(prompt);
      newKeywords = parseKeywordList(text);
      if (newKeywords.length === 0) throw new Error('no usable output');
    } catch (err) {
      keywordSource = 'fallback';
      logError('FIX-WORKER', 'AI Router unavailable. Falling back to regex keyword extraction.', err);
      newKeywords = extractFallbackKeywords(longTags);
    }

    if (newKeywords.length === 0) {
      await JobModel.updateOne({ _id: job._id }, buildStatusUpdate('NEEDS_SHORTENING', 'FAILED', 'fix-worker'));
      return { status: 'FAILED' };
    }

    const goodTags = job.tags.filter((t: string) => !(t.length > 25 || t.split(' ').length > 3));
    const finalTags = [...new Set([...goodTags, ...newKeywords])];

    await JobModel.updateOne({ _id: job._id }, buildStatusUpdate('NEEDS_SHORTENING', 'PENDING_REVIEW', 'fix-worker', { proposedTags: finalTags }));
    await enqueue('supervise-tags', 'review', { jobId: data.jobId }, { attempts: 3, backoff: { type: 'exponential', delay: 5000 } });
    return { status: 'PENDING_REVIEW', tags: finalTags, source: keywordSource };
  });
}
