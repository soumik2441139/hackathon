import { rerank } from '../../src/services/ranking/rerank.service';
import { IJob } from '../../src/models/Job';
import { IParsedData } from '../../src/models/Resume';

function makeJob(overrides: Partial<IJob> = {}): IJob {
    return {
        _id: 'job-1',
        title: 'Software Engineer',
        company: 'TestCo',
        tags: [],
        skills: ['node.js', 'react', 'mongodb'],
        level: 'junior',
        domains: ['Web'],
        createdAt: new Date(),
        ...overrides,
    } as any as IJob;
}

function makeCandidate(overrides: Partial<IParsedData> = {}): IParsedData {
    return {
        skills: ['Node.js', 'React', 'TypeScript'],
        experience_level: 'junior',
        domains: ['Web'],
        ...overrides,
    } as IParsedData;
}

describe('rerank service', () => {
    it('ranks job with higher skill overlap first', () => {
        const jobs = [
            makeJob({ _id: 'low', skills: ['python'] }),
            makeJob({ _id: 'high', skills: ['node.js', 'react'] }),
        ];
        const candidate = makeCandidate();

        const result = rerank(jobs, candidate);
        expect(result[0].job._id).toBe('high');
        expect(result[0].score).toBeGreaterThan(result[1].score);
    });

    it('adds +10 for experience level match', () => {
        const job = makeJob({ level: 'junior', skills: [] });
        const candidate = makeCandidate({ skills: [], experience_level: 'junior' });

        const result = rerank([job], candidate);
        expect(result[0].score).toBeGreaterThanOrEqual(10);
    });

    it('adds +6 per domain match', () => {
        const job = makeJob({ domains: ['Web', 'Cloud'], skills: [] });
        const candidate = makeCandidate({ skills: [], domains: ['Web', 'Cloud'] });

        const result = rerank([job], candidate);
        // 2 domains × 6 = 12
        expect(result[0].score).toBeGreaterThanOrEqual(12);
    });

    it('adds +10 recency boost for jobs < 7 days old', () => {
        const recentJob = makeJob({ createdAt: new Date(), skills: [] });
        const result = rerank([recentJob], makeCandidate({ skills: [] }));
        expect(result[0].score).toBeGreaterThanOrEqual(10);
    });

    it('adds +5 recency boost for jobs 8-30 days old', () => {
        const oldJob = makeJob({
            createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
            skills: [],
        });
        const result = rerank([oldJob], makeCandidate({ skills: [] }));
        expect(result[0].score).toBeGreaterThanOrEqual(5);
    });

    it('gives no recency boost for jobs > 30 days old', () => {
        const ancientJob = makeJob({
            createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
            skills: [],
            level: undefined,
            domains: [],
        });
        const result = rerank([ancientJob], makeCandidate({ skills: [], experience_level: undefined, domains: [] }));
        expect(result[0].score).toBe(0);
    });

    it('returns results sorted descending by score', () => {
        const jobs = [
            makeJob({ _id: 'a', skills: ['python'] }),
            makeJob({ _id: 'b', skills: ['node.js', 'react', 'typescript'] }),
            makeJob({ _id: 'c', skills: ['react'] }),
        ];
        const candidate = makeCandidate();

        const result = rerank(jobs, candidate);
        for (let i = 1; i < result.length; i++) {
            expect(result[i - 1].score).toBeGreaterThanOrEqual(result[i].score);
        }
    });
});
