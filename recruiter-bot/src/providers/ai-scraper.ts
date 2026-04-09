import { GoogleGenAI } from '@google/genai';
import axios from 'axios';
import { ScrapedJob } from './page-scraper';

/**
 * Multi-provider AI scraper waterfall.
 *
 * Provider chain (tried in order until one succeeds):
 *   1. Gemini 2.0 Flash  — 1,500 req/day free  (Google AI)
 *   2. Groq Llama 3.1    — 14,400 req/day free  (groq.com) + 1 retry on 429
 *   3. OpenRouter Gemma  — free tier            (openrouter.ai)
 *
 * Fixes applied:
 *   - OpenRouter model changed to google/gemma-3-4b-it:free (old llama model returns 404)
 *   - Groq: 1 automatic retry with 2s sleep on rate-limit before giving up
 *   - Prompt truncated to 6k chars (was 12k) — reduces tokens & latency
 *   - response_format removed from OpenRouter (causes 404 on free models)
 */

const GEMINI_KEY     = process.env.GEMINI_API_KEY;
const GROQ_KEY       = process.env.GROQ_API_KEY;
const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY;

const geminiClient = GEMINI_KEY ? new GoogleGenAI({ apiKey: GEMINI_KEY }) : null;

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

// ─── Shared prompt ────────────────────────────────────────────────────────────

function buildPrompt(text: string): string {
    return `You are an expert technical recruiter data extractor.
Extract responsibilities, requirements (qualifications) and skill tags from the webpage text below.
Return ONLY a valid JSON object — no markdown, no explanation:
{"responsibilities":string[],"requirements":string[],"tags":string[]}

Text:
${text.replace(/\s+/g, ' ').substring(0, 6000)}`;
}

function parseResponse(raw: string, baseJob: ScrapedJob): ScrapedJob {
    const cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
    const parsed = JSON.parse(cleaned);
    return {
        ...baseJob,
        responsibilities: Array.isArray(parsed.responsibilities) && parsed.responsibilities.length > 0
            ? parsed.responsibilities : baseJob.responsibilities,
        requirements: Array.isArray(parsed.requirements) && parsed.requirements.length > 0
            ? parsed.requirements : baseJob.requirements,
        tags: Array.isArray(parsed.tags) && parsed.tags.length > 0
            ? parsed.tags : baseJob.tags,
    };
}

// ─── Provider 1: Gemini ───────────────────────────────────────────────────────

async function tryGemini(text: string, url: string, baseJob: ScrapedJob): Promise<ScrapedJob | null> {
    if (!geminiClient) return null;
    try {
        console.log(`🧠 [AI Scraper] Gemini → ${url.slice(0, 55)}...`);
        const response = await geminiClient.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: buildPrompt(text),
            config: { responseMimeType: 'application/json', temperature: 0.1 }
        });
        const raw = response.text;
        if (!raw) return null;
        const result = parseResponse(raw, baseJob);
        console.log('✅ [AI Scraper] Gemini extracted data');
        return result;
    } catch (err: any) {
        const isQuota = err?.message?.includes('429') || err?.message?.includes('RESOURCE_EXHAUSTED');
        console.warn(`⚠️ [AI Scraper] Gemini failed${isQuota ? ' (quota)' : ''}: ${err.message?.slice(0, 80)}`);
        return null;
    }
}

// ─── Provider 2: Groq (1 auto-retry on 429) ──────────────────────────────────

async function tryGroq(text: string, url: string, baseJob: ScrapedJob): Promise<ScrapedJob | null> {
    if (!GROQ_KEY) return null;

    for (let attempt = 1; attempt <= 2; attempt++) {
        try {
            if (attempt === 1) console.log(`🧠 [AI Scraper] Groq → ${url.slice(0, 55)}...`);
            const { data } = await axios.post(
                'https://api.groq.com/openai/v1/chat/completions',
                {
                    model: 'llama-3.1-8b-instant',
                    messages: [{ role: 'user', content: buildPrompt(text) }],
                    temperature: 0.1,
                    max_tokens: 800,
                    response_format: { type: 'json_object' },
                },
                {
                    headers: { Authorization: `Bearer ${GROQ_KEY}`, 'Content-Type': 'application/json' },
                    timeout: 15000,
                }
            );
            const raw = data?.choices?.[0]?.message?.content;
            if (!raw) return null;
            const result = parseResponse(raw, baseJob);
            console.log('✅ [AI Scraper] Groq extracted data');
            return result;
        } catch (err: any) {
            const is429 = err?.response?.status === 429;
            if (is429 && attempt === 1) {
                console.warn('⚠️ [AI Scraper] Groq rate-limited — retrying in 2s...');
                await sleep(2000);
                continue;
            }
            console.warn(`⚠️ [AI Scraper] Groq failed${is429 ? ' (quota)' : ''}: ${err.message?.slice(0, 80)}`);
            return null;
        }
    }
    return null;
}

// ─── Provider 3: OpenRouter ───────────────────────────────────────────────────

async function tryOpenRouter(text: string, url: string, baseJob: ScrapedJob): Promise<ScrapedJob | null> {
    if (!OPENROUTER_KEY) return null;
    try {
        console.log(`🧠 [AI Scraper] OpenRouter → ${url.slice(0, 55)}...`);
        const { data } = await axios.post(
            'https://openrouter.ai/api/v1/chat/completions',
            {
                // google/gemma-3-4b-it:free — actively maintained free model
                // NOTE: old meta-llama/llama-3.1-8b-instruct:free was removed → caused 404
                model: 'google/gemma-3-4b-it:free',
                messages: [{ role: 'user', content: buildPrompt(text) }],
                temperature: 0.1,
                max_tokens: 800,
                // response_format intentionally omitted — free models don't support it → 404
            },
            {
                headers: {
                    Authorization: `Bearer ${OPENROUTER_KEY}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': 'https://opushire-backend.azurewebsites.net',
                    'X-Title': 'OpusHire Recruiter Bot',
                },
                timeout: 20000,
            }
        );
        const raw = data?.choices?.[0]?.message?.content;
        if (!raw) return null;
        const result = parseResponse(raw, baseJob);
        console.log('✅ [AI Scraper] OpenRouter extracted data');
        return result;
    } catch (err: any) {
        const status = err?.response?.status;
        console.warn(`⚠️ [AI Scraper] OpenRouter failed${status === 429 ? ' (quota)' : ''}: ${err.message?.slice(0, 80)}`);
        return null;
    }
}

// ─── Public entry point ───────────────────────────────────────────────────────

export async function aiScrapeJob(htmlText: string, url: string, baseJob: ScrapedJob): Promise<ScrapedJob> {
    if (!GEMINI_KEY && !GROQ_KEY && !OPENROUTER_KEY) {
        console.warn('⚠️ [AI Scraper] No AI provider keys configured — skipping fallback.');
        return baseJob;
    }

    const result =
        await tryGemini(htmlText, url, baseJob) ??
        await tryGroq(htmlText, url, baseJob) ??
        await tryOpenRouter(htmlText, url, baseJob);

    if (!result) {
        console.warn(`⚠️ [AI Scraper] All providers exhausted for: ${url.slice(0, 60)}`);
        return baseJob;
    }
    return result;
}
