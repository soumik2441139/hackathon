/**
 * Integration Tests — fix.worker.ts
 * Uses a REAL MongoDB connection (standard in industry grade projects).
 */

import { registerFixWorker } from '../../src/services/queue/workers/fix.worker';
import { enqueue } from '../../src/services/queue/queue.service';
import JobModel from '../../src/models/Job';
import mongoose from 'mongoose';

// We still mock internal services that we don't want to trigger during this test
// e.g. We don't want to actually enqueue the next step in the pipeline.
jest.mock('../../src/services/queue/queue.service', () => ({
  createWorker: jest.fn(),
  enqueue: jest.fn(),
}));

jest.mock('../../src/services/rag/rag.service', () => ({
  getExamples: jest.fn(async () => []),
  buildFewShotSection: jest.fn(() => ''),
}));

jest.mock('../../src/services/memory/agent.memory', () => ({
  buildMemoryContext: jest.fn(async () => ''),
}));

const mockEnqueue = enqueue as jest.Mock;
const { createWorker } = require('../../src/services/queue/queue.service');

let capturedHandler: (data: any) => Promise<any>;

beforeAll(async () => {
    // Capture the handler registered by the worker
    (createWorker as jest.Mock).mockImplementation((_name: string, handler: any) => {
        capturedHandler = handler;
        return null;
    });
    registerFixWorker();
});

beforeEach(async () => {
  jest.clearAllMocks();
  // Clean the Job collection before each test
  await JobModel.deleteMany({});
});

describe('fix.worker — REAL Integration Test', () => {

  it('skips if job does not exist in the real database', async () => {
    const result = await capturedHandler({ jobId: new mongoose.Types.ObjectId().toString() });
    expect(result).toEqual({ skipped: true });
  });

  it('correctly processes a REAL job from the database', async () => {
    process.env.GROQ_API_KEY = 'test-key';
    
    // Create a real job that needs fixing
    const job = await JobModel.create({
      title: 'Senior Engineer',
      company: 'Tech Corp',
      type: 'Full-time',
      mode: 'Remote',
      description: 'Need someone with deep knowledge of TypeScript and advanced Reactor patterns.',
      tagTileStatus: 'NEEDS_SHORTENING',
      tags: ['Need someone with deep knowledge of TypeScript and advanced Reactor patterns.'],
    });

    // Mock the external AI API call (standard even in integration tests to avoid cost/flakiness)
    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({ choices: [{ message: { content: 'TYPESCRIPT, REACT, NODE.JS' } }] }),
    });

    const result = await capturedHandler({ jobId: job._id.toString() });

    expect(result.status).toBe('PENDING_REVIEW');
    
    // Verify the REAL database was updated
    const updatedJob = await JobModel.findById(job._id);
    expect(updatedJob?.tagTileStatus).toBe('PENDING_REVIEW');
    expect(updatedJob?.proposedTags).toContain('TYPESCRIPT');
    
    // Verify the next pipeline step was enqueued
    expect(mockEnqueue).toHaveBeenCalledWith('supervise-tags', 'review', { jobId: job._id.toString() }, expect.any(Object));
  });

  it('falls back to heuristic extraction when AI fails', async () => {
    const job = await JobModel.create({
      title: 'DevOps',
      company: 'Cloud Co',
      type: 'Contract',
      mode: 'Hybrid',
      description: 'Docker Kubernetes Terraform',
      tagTileStatus: 'NEEDS_SHORTENING',
      tags: ['Docker', 'Kubernetes', 'Terraform'],
    });

    // Simulate AI failure
    (global as any).fetch = jest.fn().mockRejectedValue(new Error('AI Offline'));

    const result = await capturedHandler({ jobId: job._id.toString() });

    expect(result.source).toBe('fallback');
    const updatedJob = await JobModel.findById(job._id);
    expect(updatedJob?.tagTileStatus).toBe('PENDING_REVIEW');
  });

});
