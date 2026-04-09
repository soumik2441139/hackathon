/**
 * AI Scraper Unit Tests
 * Tests the Groq→OpenRouter waterfall and regression checks.
 * GEMINI_API_KEY is intentionally NOT set so geminiClient=null (skip Gemini).
 * All HTTP calls are mocked.
 */

import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

jest.mock('@google/genai', () => ({
    GoogleGenAI: jest.fn(),
}));

// Keys set BEFORE any import so module-level consts pick them up
process.env.GROQ_API_KEY = 'test-groq-key';
process.env.OPENROUTER_API_KEY = 'test-openrouter-key';
delete process.env.GEMINI_API_KEY; // ensure geminiClient = null

import { aiScrapeJob } from '../providers/ai-scraper';
import { ScrapedJob } from '../providers/page-scraper';

const BASE_JOB: ScrapedJob = {
    title: 'Junior Backend Developer',
    company: 'Acme Corp',
    location: 'Remote',
    salary: '',
    description: 'Build APIs with Node.js.',
    tags: [],
    responsibilities: [],
    requirements: [],
};

const VALID_RESPONSE = JSON.stringify({
    responsibilities: ['Build REST APIs', 'Write unit tests'],
    requirements: ['Node.js', 'TypeScript'],
    tags: ['Node.js', 'TypeScript', 'Express'],
});

const HTML = 'Junior Backend Developer. Requirements: Node.js, TypeScript.';

afterEach(() => jest.clearAllMocks());

describe('AI Scraper — Groq + OpenRouter waterfall', () => {

    it('returns baseJob if no keys are configured', async () => {
        const saved = { groq: process.env.GROQ_API_KEY, or: process.env.OPENROUTER_API_KEY };
        delete process.env.GROQ_API_KEY;
        delete process.env.OPENROUTER_API_KEY;

        const result = await aiScrapeJob(HTML, 'https://example.com', BASE_JOB);
        expect(result).toEqual(BASE_JOB);

        process.env.GROQ_API_KEY = saved.groq;
        process.env.OPENROUTER_API_KEY = saved.or;
    });

    it('extracts data via Groq (first provider)', async () => {
        mockedAxios.post.mockResolvedValueOnce({
            data: { choices: [{ message: { content: VALID_RESPONSE } }] },
            status: 200,
        });

        const result = await aiScrapeJob(HTML, 'https://example.com', BASE_JOB);

        expect(result.tags).toContain('Node.js');
        expect(result.responsibilities).toContain('Build REST APIs');
        expect(mockedAxios.post).toHaveBeenCalledTimes(1);
        expect((mockedAxios.post.mock.calls[0][0] as string)).toContain('groq.com');
    });

    it('falls through to OpenRouter when Groq fails with 429', async () => {
        // Groq attempt 1 → 429
        mockedAxios.post.mockRejectedValueOnce(Object.assign(new Error('Rate limited'), { response: { status: 429 } }));
        // Groq retry → 429
        mockedAxios.post.mockRejectedValueOnce(Object.assign(new Error('Rate limited'), { response: { status: 429 } }));
        // OpenRouter succeeds
        mockedAxios.post.mockResolvedValueOnce({
            data: { choices: [{ message: { content: VALID_RESPONSE } }] },
            status: 200,
        });

        const result = await aiScrapeJob(HTML, 'https://example.com', BASE_JOB);
        expect(result.tags).toContain('Node.js');

        const orCall = mockedAxios.post.mock.calls.find(c => (c[0] as string).includes('openrouter'));
        expect(orCall).toBeDefined();
        expect((orCall![1] as any).model).toBe('google/gemma-3-4b-it:free');
    });

    it('returns baseJob when all providers fail', async () => {
        mockedAxios.post.mockRejectedValue(new Error('Network error'));

        const result = await aiScrapeJob(HTML, 'https://example.com', BASE_JOB);
        expect(result).toEqual(BASE_JOB);
    });

    it('OpenRouter body does NOT include response_format (causes 404 on free models)', async () => {
        mockedAxios.post.mockRejectedValueOnce(Object.assign(new Error('Rate limited'), { response: { status: 429 } }));
        mockedAxios.post.mockRejectedValueOnce(Object.assign(new Error('Rate limited'), { response: { status: 429 } }));
        mockedAxios.post.mockResolvedValueOnce({
            data: { choices: [{ message: { content: VALID_RESPONSE } }] },
            status: 200,
        });

        await aiScrapeJob(HTML, 'https://example.com', BASE_JOB);

        const orCall = mockedAxios.post.mock.calls.find(c => (c[0] as string).includes('openrouter'));
        expect((orCall![1] as any).response_format).toBeUndefined();
    });

});
