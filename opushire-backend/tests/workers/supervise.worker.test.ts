/**
 * Integration Tests — supervise.worker.ts
 * Uses a REAL MongoDB connection (standard in industry grade projects).
 */

import { registerSuperviseWorker } from '../../src/services/queue/workers/supervise.worker';
import { enqueue } from '../../src/services/queue/queue.service';
import JobModel from '../../src/models/Job';
import mongoose from 'mongoose';
import axios from 'axios';

// Mock queue to intercept next pipeline triggers
jest.mock('../../src/services/queue/queue.service', () => ({
  createWorker: jest.fn(),
  enqueue: jest.fn(),
}));

jest.mock('../../src/services/rag/rag.service', () => ({
  storeExample: jest.fn(async () => {}),
}));

jest.mock('../../src/services/memory/agent.memory', () => ({
  recordEpisode: jest.fn(async () => {}),
}));

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const mockEnqueue = enqueue as jest.Mock;
const { createWorker } = require('../../src/services/queue/queue.service');

let capturedHandler: (data: any) => Promise<any>;

beforeAll(async () => {
    (createWorker as jest.Mock).mockImplementation((_name: string, handler: any) => {
        capturedHandler = handler;
        return null;
    });
    registerSuperviseWorker();
});

beforeEach(async () => {
  jest.clearAllMocks();
  await JobModel.deleteMany({});
});

describe('supervise.worker — REAL Integration Test', () => {

  it('skips if job does not exist', async () => {
    const result = await capturedHandler({ jobId: new mongoose.Types.ObjectId().toString() });
    expect(result).toEqual({ skipped: true });
  });

  it('approves REAL tags from the database when AI says YES', async () => {
    process.env.GROQ_API_KEY = 'test-key';
    
    // Create a real job in PENDING_REVIEW state
    const job = await JobModel.create({
      title: 'Fullstack Dev',
      company: 'App Studio',
      type: 'Full-time',
      mode: 'Onsite',
      description: 'Senior Node.js role.',
      tagTileStatus: 'PENDING_REVIEW',
      tags: ['Senior Node.js role.'],
      proposedTags: ['NODE.JS', 'BACKEND'],
    }) as any;

    // Mock AI approval
    mockedAxios.post.mockResolvedValueOnce({
      data: { choices: [{ message: { content: 'YES these look perfect' } }] },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as any,
    });

    const result = await capturedHandler({ jobId: job._id.toString() });

    expect(result.status).toBe('READY_TO_APPLY');
    
    // Verify REAL DB update
    const updatedJob = await JobModel.findById(job._id);
    expect(updatedJob?.tagTileStatus).toBe('READY_TO_APPLY');
    
    // Verify transition to matching
    expect(mockEnqueue).toHaveBeenCalledWith('match-candidates', 'hunt', expect.objectContaining({ jobId: job._id.toString() }));
  });

  it('rejects hallucinated tags and returns them for fixing', async () => {
    const job = await JobModel.create({
      title: 'Designer',
      company: 'Creative Lab',
      type: 'Part-time',
      mode: 'Remote',
      description: 'UX/UI Design role.',
      tagTileStatus: 'PENDING_REVIEW',
      tags: ['UX/UI Design role.'],
      proposedTags: ['KERNEL HACKING', 'ASSEMBLY'], // Hallucination!
    }) as any;

    // Mock AI rejection
    mockedAxios.post.mockResolvedValueOnce({
      data: { choices: [{ message: { content: 'NO these are totally wrong' } }] },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as any,
    });

    const result = await capturedHandler({ jobId: job._id.toString() });

    expect(result.status).toBe('NEEDS_SHORTENING');
    
    // Verify REAL DB state
    const updatedJob = await JobModel.findById(job._id);
    expect(updatedJob?.tagTileStatus).toBe('NEEDS_SHORTENING');
    
    // Verify re-enqueue to fix worker
    expect(mockEnqueue).toHaveBeenCalledWith('fix-tags', 'fix', expect.objectContaining({ jobId: job._id.toString() }), expect.any(Object));
  });

});
