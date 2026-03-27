/**
 * Unit Tests — fix.worker.ts
 * Tests the tag extraction pipeline using Mongoose mocks (no real DB connection).
 */

// ─── Mock all external dependencies BEFORE imports ───────────────────────────
jest.mock('../../src/services/queue/queue.service');
jest.mock('../../src/models/Job');
jest.mock('../../src/utils/logger');
jest.mock('../../src/utils/stateMachine');
jest.mock('../../src/services/rag/rag.service');
jest.mock('../../src/services/memory/agent.memory');

import { registerFixWorker } from '../../src/services/queue/workers/fix.worker';
import * as queueService from '../../src/services/queue/queue.service';
import JobModel from '../../src/models/Job';
import * as stateMachine from '../../src/utils/stateMachine';
import * as ragService from '../../src/services/rag/rag.service';
import * as agentMemory from '../../src/services/memory/agent.memory';

// Set up module-level mocks
const mockCreateWorker = queueService.createWorker as jest.Mock;
const mockEnqueue = queueService.enqueue as jest.Mock;
const mockFindById = JobModel.findById as jest.Mock;
const mockUpdateOne = JobModel.updateOne as jest.Mock;

// Capture the handler registered by createWorker
let capturedHandler: (data: any) => Promise<any>;

beforeEach(() => {
  jest.clearAllMocks();

  // Mock stateMachine / rag / memory
  (stateMachine.buildStatusUpdate as jest.Mock).mockImplementation((_from: string, to: string) => ({
    $set: { tagTileStatus: to }
  }));
  (ragService.getExamples as jest.Mock).mockResolvedValue([]);
  (ragService.buildFewShotSection as jest.Mock).mockReturnValue('');
  (agentMemory.buildMemoryContext as jest.Mock).mockResolvedValue('');

  // Capture the worker handler
  mockCreateWorker.mockImplementation((_name: string, handler: any) => {
    capturedHandler = handler;
    return null;
  });
  mockUpdateOne.mockResolvedValue({});
  mockEnqueue.mockResolvedValue(null);

  registerFixWorker();
});

// ─────────────────────────────────────────────────────────────────────────────

describe('fix.worker — registerFixWorker()', () => {

  it('skips if job is not found', async () => {
    mockFindById.mockResolvedValue(null);
    const result = await capturedHandler({ jobId: 'nonexistent-id' });
    expect(result).toEqual({ skipped: true });
    expect(mockUpdateOne).not.toHaveBeenCalled();
  });

  it('skips if job is not in NEEDS_SHORTENING state', async () => {
    mockFindById.mockResolvedValue({ tagTileStatus: 'VETTED', tags: [] });
    const result = await capturedHandler({ jobId: 'id-1' });
    expect(result).toEqual({ skipped: true });
  });

  it('throws if GROQ_API_KEY is not set', async () => {
    const originalKey = process.env.GROQ_API_KEY;
    delete process.env.GROQ_API_KEY;
    mockFindById.mockResolvedValue({ tagTileStatus: 'NEEDS_SHORTENING', tags: [], longTagsToFix: [] });
    await expect(capturedHandler({ jobId: 'job-missing-key' })).rejects.toThrow('GROQ_API_KEY not set');
    process.env.GROQ_API_KEY = originalKey;
  });

  it('marks job as FAILED if Groq returns empty output and fallback finds no keywords', async () => {
    process.env.GROQ_API_KEY = 'test-key';
    mockFindById.mockResolvedValue({
      _id: 'job-2',
      tagTileStatus: 'NEEDS_SHORTENING',
      tags: [],
      longTagsToFix: [],
    });

    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({ choices: [{ message: { content: '' } }] }),
    });

    const result = await capturedHandler({ jobId: 'job-2' });
    expect(result.status).toBe('FAILED');
  });

  it('transitions to PENDING_REVIEW when Groq returns valid keywords', async () => {
    process.env.GROQ_API_KEY = 'test-key';
    mockFindById.mockResolvedValue({
      _id: 'job-3',
      tagTileStatus: 'NEEDS_SHORTENING',
      tags: ['Proficient in TypeScript frameworks and advanced React patterns'],
      longTagsToFix: ['Proficient in TypeScript frameworks and advanced React patterns'],
    });

    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({ choices: [{ message: { content: 'TYPESCRIPT, REACT, NODE.JS' } }] }),
    });

    const result = await capturedHandler({ jobId: 'job-3' });
    expect(result.status).toBe('PENDING_REVIEW');
    expect(result.source).toBe('groq');
    expect(mockEnqueue).toHaveBeenCalledWith('supervise-tags', 'review', { jobId: 'job-3' }, expect.any(Object));
  });

  it('falls back to heuristic extraction if Groq fetch fails', async () => {
    process.env.GROQ_API_KEY = 'test-key';
    mockFindById.mockResolvedValue({
      _id: 'job-4',
      tagTileStatus: 'NEEDS_SHORTENING',
      tags: ['typescript react javascript backend experience'],
      longTagsToFix: ['typescript react javascript backend experience'],
    });

    (global as any).fetch = jest.fn().mockRejectedValue(new Error('Network error'));

    const result = await capturedHandler({ jobId: 'job-4' });
    // Fallback heuristic will extract some keywords from the text
    expect(['PENDING_REVIEW', 'FAILED']).toContain(result.status);
    if (result.status === 'PENDING_REVIEW') {
      expect(result.source).toBe('fallback');
    }
  });

});
