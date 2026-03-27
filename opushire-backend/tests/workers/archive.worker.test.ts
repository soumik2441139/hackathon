/**
 * Integration Tests — archive.worker.ts
 * Uses a REAL MongoDB connection to verify ghost job detection logic.
 */

import { registerArchiveWorker } from '../../src/services/queue/workers/archive.worker';
import JobModel from '../../src/models/Job';
import BotStat from '../../src/models/BotStat';
import mongoose from 'mongoose';
import axios from 'axios';

jest.mock('../../src/services/queue/queue.service', () => ({
  createWorker: jest.fn(),
}));

jest.mock('axios');
const mockedAxios = axios as unknown as jest.Mock;

const { createWorker } = require('../../src/services/queue/queue.service');

let capturedHandler: (data: any) => Promise<any>;

beforeAll(async () => {
    (createWorker as jest.Mock).mockImplementation((_name: string, handler: any) => {
        capturedHandler = handler;
        return null;
    });
    registerArchiveWorker();
});

beforeEach(async () => {
    jest.clearAllMocks();
    await JobModel.deleteMany({});
    // Reset BotStat for today
    await BotStat.updateOne(
        { date: new Date().toISOString().split('T')[0] },
        { $set: { ghostJobsRemoved: 0 } },
        { upsert: true }
    );
});

describe('archive.worker — REAL Integration Test', () => {

    it('skips if job does not exist', async () => {
        const result = await capturedHandler({ jobId: new mongoose.Types.ObjectId().toString() });
        expect(result).toEqual({ skipped: true });
    });

    it('archives job if axios returns 404', async () => {
        const job = await JobModel.create({
            title: 'Ghost Role',
            company: 'Phantom Inc',
            type: 'Full-time',
            mode: 'Remote',
            description: 'This is a ghost job.',
            externalUrl: 'https://example.com/expired-job',
            isArchived: false,
            source: 'remotive'
        });

        mockedAxios.mockResolvedValueOnce({
            status: 404,
            statusText: 'Not Found',
            headers: {},
            config: {} as any
        });

        const result = await capturedHandler({ jobId: job._id.toString() });

        expect(result.archived).toBe(true);
        
        const updatedJob = await JobModel.findById(job._id);
        expect(updatedJob?.isArchived).toBe(true);
        expect((updatedJob as any).archiveReason).toContain('Ghost');

        // Verify BotStat increment
        const stats = await BotStat.getToday();
        expect(stats.ghostJobsRemoved).toBe(1);
    });

    it('keeps job alive if axios returns 200', async () => {
        const job = await JobModel.create({
            title: 'Active Role',
            company: 'Real Co',
            type: 'Full-time',
            mode: 'Remote',
            description: 'This is an active job.',
            externalUrl: 'https://example.com/active-job',
            isArchived: false,
            source: 'remotive'
        });

        mockedAxios.mockResolvedValueOnce({
            status: 200,
            statusText: 'OK',
            headers: {},
            config: {} as any
        });

        const result = await capturedHandler({ jobId: job._id.toString() });

        expect(result.status).toBe('alive');
        
        const updatedJob = await JobModel.findById(job._id);
        expect(updatedJob?.isArchived).toBe(false);
    });

    it('skips manual jobs to preserve user-added content', async () => {
        const job = await JobModel.create({
            title: 'Manual Role',
            company: 'My Company',
            type: 'Full-time',
            mode: 'Onsite',
            description: 'This is a manual job.',
            externalUrl: 'https://example.com/manual',
            isArchived: false,
            source: 'manual'
        });

        const result = await capturedHandler({ jobId: job._id.toString() });

        expect(result.skipped).toBe(true);
        expect(mockedAxios).not.toHaveBeenCalled();
    });

});
