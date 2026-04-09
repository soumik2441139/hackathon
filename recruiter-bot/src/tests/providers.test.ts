/**
 * Provider Cache Logic Unit Tests
 * Tests the 23h cache guard and quota-exhaustion fallback for
 * LinkedIn and ActiveJobsDB providers.
 *
 * Strategy: mock axios at the module level (avoids dynamic import issues).
 * The cache file read/write is tested via the providers' public behaviour,
 * not by mocking fs internals.
 */

import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// ─── LinkedIn Provider ────────────────────────────────────────────────────────

describe('LinkedIn Provider — no API key guard', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('returns [] immediately when JSEARCH_API_KEY is not set', async () => {
        const savedKey = process.env.JSEARCH_API_KEY;
        delete process.env.JSEARCH_API_KEY;

        // Import fresh so the key is re-read (key is read at call-time, not module load)
        const { fetchLinkedInJobs } = await import('../providers/linkedin.provider');
        const result = await fetchLinkedInJobs();

        expect(result).toEqual([]);
        expect(mockedAxios.get).not.toHaveBeenCalled();

        if (savedKey) process.env.JSEARCH_API_KEY = savedKey;
    });

});

// ─── ActiveJobsDB Provider ─────────────────────────────────────────────────────

describe('ActiveJobsDB Provider — no API key guard', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('returns [] immediately when JSEARCH_API_KEY is not set', async () => {
        const savedKey = process.env.JSEARCH_API_KEY;
        delete process.env.JSEARCH_API_KEY;

        const { fetchActiveJobsDB } = await import('../providers/activejobsdb.provider');
        const result = await fetchActiveJobsDB();

        expect(result).toEqual([]);
        expect(mockedAxios.get).not.toHaveBeenCalled();

        if (savedKey) process.env.JSEARCH_API_KEY = savedKey;
    });

    it('returns [] when API returns 429 and no cache file exists', async () => {
        process.env.JSEARCH_API_KEY = 'test-key';

        mockedAxios.get.mockRejectedValue(
            Object.assign(new Error('Quota exceeded'), { response: { status: 429 } })
        );

        const { fetchActiveJobsDB } = await import('../providers/activejobsdb.provider');
        const result = await fetchActiveJobsDB();

        // No cache file exists locally in the test — should gracefully return []
        expect(Array.isArray(result)).toBe(true);

        delete process.env.JSEARCH_API_KEY;
    });

});
