/**
 * Unit Tests — supervise.worker.ts
 * Tests the QA hallucination-detection pipeline using Mongoose mocks.
 */

// ─── Mock all external dependencies BEFORE imports ───────────────────────────
jest.mock('../../src/services/queue/queue.service');
jest.mock('../../src/models/Job');
jest.mock('../../src/utils/stateMachine');
jest.mock('../../src/services/rag/rag.service');
jest.mock('../../src/services/memory/agent.memory');

import { registerSuperviseWorker } from '../../src/services/queue/workers/supervise.worker';
import * as queueService from '../../src/services/queue/queue.service';
import JobModel from '../../src/models/Job';
import * as stateMachine from '../../src/utils/stateMachine';
import * as ragService from '../../src/services/rag/rag.service';
import * as agentMemory from '../../src/services/memory/agent.memory';

const mockCreateWorker = queueService.createWorker as jest.Mock;
const mockEnqueue = queueService.enqueue as jest.Mock;
const mockFindById = JobModel.findById as jest.Mock;
const mockUpdateOne = JobModel.updateOne as jest.Mock;

let capturedHandler: (data: any) => Promise<any>;

beforeEach(() => {
  jest.clearAllMocks();
  (stateMachine.buildStatusUpdate as jest.Mock).mockImplementation((_from: string, to: string) => ({
    $set: { tagTileStatus: to }
  }));
  (ragService.storeExample as jest.Mock).mockResolvedValue(undefined);
  (agentMemory.recordEpisode as jest.Mock).mockResolvedValue(undefined);

  mockCreateWorker.mockImplementation((_name: string, handler: any) => {
    capturedHandler = handler;
    return null;
  });
  mockUpdateOne.mockResolvedValue({});
  mockEnqueue.mockResolvedValue(null);

  registerSuperviseWorker();
});

// ─────────────────────────────────────────────────────────────────────────────

describe('supervise.worker — registerSuperviseWorker()', () => {

  it('skips if job is not found', async () => {
    mockFindById.mockResolvedValue(null);
    const result = await capturedHandler({ jobId: 'ghost-id' });
    expect(result).toEqual({ skipped: true });
  });

  it('skips if job is not in PENDING_REVIEW state', async () => {
    mockFindById.mockResolvedValue({ tagTileStatus: 'VETTED' });
    const result = await capturedHandler({ jobId: 'id-1' });
    expect(result).toEqual({ skipped: true });
  });

  it('throws if GROQ_API_KEY is not set', async () => {
    const originalKey = process.env.GROQ_API_KEY;
    delete process.env.GROQ_API_KEY;
    mockFindById.mockResolvedValue({ tagTileStatus: 'PENDING_REVIEW', tags: [], proposedTags: [] });
    await expect(capturedHandler({ jobId: 'id-2' })).rejects.toThrow('GROQ_API_KEY not set');
    process.env.GROQ_API_KEY = originalKey;
  });

  it('approves tags when Groq responds YES and chains to match-candidates', async () => {
    process.env.GROQ_API_KEY = 'test-key';
    mockFindById.mockResolvedValue({
      _id: 'job-approve',
      tagTileStatus: 'PENDING_REVIEW',
      tags: ['Must have exp with machine learning and deep learning neural architectures'],
      longTagsToFix: ['Must have exp with machine learning and deep learning neural architectures'],
      proposedTags: ['MACHINE LEARNING', 'DEEP LEARNING', 'NEURAL NETS'],
    });

    (global as any).fetch = jest.fn().mockResolvedValue({
      json: async () => ({ choices: [{ message: { content: 'YES these look accurate' } }] }),
    });

    const result = await capturedHandler({ jobId: 'job-approve' });
    expect(result.status).toBe('READY_TO_APPLY');
    expect(mockEnqueue).toHaveBeenCalledWith('match-candidates', 'hunt', { jobId: 'job-approve' });
  });

  it('rejects and re-enqueues to fix-tags when Groq responds NO', async () => {
    process.env.GROQ_API_KEY = 'test-key';
    mockFindById.mockResolvedValue({
      _id: 'job-reject',
      tagTileStatus: 'PENDING_REVIEW',
      tags: [],
      longTagsToFix: [],
      proposedTags: ['WRONG', 'HALLUCINATED', 'TAGS'],
    });

    (global as any).fetch = jest.fn().mockResolvedValue({
      json: async () => ({ choices: [{ message: { content: 'NO the keywords are inaccurate' } }] }),
    });

    const result = await capturedHandler({ jobId: 'job-reject' });
    expect(result.status).toBe('NEEDS_SHORTENING');
    expect(result.reason).toBe('Hallucination rejected');
    expect(mockEnqueue).toHaveBeenCalledWith('fix-tags', 'fix', { jobId: 'job-reject' }, expect.any(Object));
  });

});
