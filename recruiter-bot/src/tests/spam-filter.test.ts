/**
 * Spam Filter Unit Tests
 * Tests the regex/heuristic pre-filter in isolation (zero external calls).
 * The AI Groq stage is mocked.
 */

// No GROQ key → forces regex-only mode (safe for unit tests)
delete process.env.GROQ_API_KEY;

import { filterSpamJobs } from '../providers/spam-filter';
import { NormalizedJob } from '../providers/remotive.provider';

function makeJob(overrides: Partial<NormalizedJob> = {}): NormalizedJob {
    return {
        title: 'Junior Software Engineer',
        company: 'Test Corp',
        companyLogo: '',
        location: 'Bengaluru, India',
        city: 'Bengaluru',
        type: 'Full-time',
        mode: 'Remote',
        salary: '',
        description: 'Work on our Node.js backend and TypeScript APIs.',
        tags: ['Node.js', 'TypeScript'],
        source: 'remotive',
        externalId: 'test-123',
        externalUrl: 'https://example.com/job/123',
        posted: '2 days ago',
        ...overrides,
    };
}

describe('Spam Filter — regex/heuristic pre-filter (no AI)', () => {

    it('passes clean, legitimate job through', async () => {
        const jobs = [makeJob()];
        const result = await filterSpamJobs(jobs);
        expect(result).toHaveLength(1);
        expect(result[0].title).toBe('Junior Software Engineer');
    });

    it('drops job with MLM keyword in description', async () => {
        const jobs = [makeJob({ description: 'Earn money fast with our commission only model!' })];
        const result = await filterSpamJobs(jobs);
        expect(result).toHaveLength(0);
    });

    it('drops job with scam keyword in title', async () => {
        const jobs = [makeJob({ title: 'Work From Home Scam Artist' })];
        const result = await filterSpamJobs(jobs);
        expect(result).toHaveLength(0);
    });

    it('drops "not on linkedin" ghost listing', async () => {
        const jobs = [makeJob({ title: 'Engineering Role NOT ON LINKEDIN' })];
        const result = await filterSpamJobs(jobs);
        expect(result).toHaveLength(0);
    });

    it('drops pure hashtag-soup title', async () => {
        const jobs = [makeJob({ title: '#hiring #remote #javascript #developer' })];
        const result = await filterSpamJobs(jobs);
        expect(result).toHaveLength(0);
    });

    it('keeps jobs that have some hashtags mixed with real words', async () => {
        const jobs = [makeJob({ title: 'Software Engineer #remote #typescript' })];
        const result = await filterSpamJobs(jobs);
        expect(result).toHaveLength(1);
    });

    it('handles empty input without crashing', async () => {
        const result = await filterSpamJobs([]);
        expect(result).toEqual([]);
    });

    it('filters multiple jobs and drops only spam ones', async () => {
        const jobs = [
            makeJob({ externalId: 'good-1', title: 'Backend Developer' }),
            makeJob({ externalId: 'spam-1', description: 'MLM pyramid scheme opportunity' }),
            makeJob({ externalId: 'good-2', title: 'Frontend Intern' }),
            makeJob({ externalId: 'spam-2', title: '#hiring #work #remote #earn' }),
        ];
        const result = await filterSpamJobs(jobs);
        expect(result).toHaveLength(2);
        expect(result.map(j => j.externalId)).toEqual(['good-1', 'good-2']);
    });

});
