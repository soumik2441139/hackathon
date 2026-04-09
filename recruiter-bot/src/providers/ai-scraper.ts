import { GoogleGenAI } from '@google/genai';
import axios from 'axios';
import { ScrapedJob } from './page-scraper';

/**
 * Multi-provider AI scraper waterfall.
 *
 * Provider chain (tried in order until one succeeds):
 *   1. Gemini 2.0 Flash  — 1,500 req/day free  (Google AI)
 *   2. Groq Llama 3.1    — 14,400 req/day free  (groq.com)
 *   3. OpenRouter Llama  — flexible free tier   (openrouter.ai)
 *
 * NOTE: None of these providers support *embeddings* — they are used
 *       here purely for structured JSON text extraction.
 */

const GEMINI_KEY     = process.env.GEMINI_API_KEY;
const GROQ_KEY       = process.env.GROQ_API_KEY;
const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY;

const geminiClient = GEMINI_KEY ? new GoogleGenAI({ apiKey: GEMINI_KEY }) : null;

// ─── Shared prompt ────────────────────────────────────────────────────────────

function buildPrompt(text: string): string {
    return `You are an expert technical recruiter data extractor.
Extract the core responsibilities, requirements (qualifications) and "nice-to-have" skill tags from the following webpage text.
Strictly return ONLY a valid JSON object — no markdown, no explanation — with this exact schema:
{
  "responsibilities": string[],
  "requirements": string[],
  "tags": string[]
}

Raw Text:
${text.replace(/\s+/g, ' ').substring(0, 12000)}`;
}

function parseResponse(raw: string, baseJob: ScrapedJob): ScrapedJob {
    // Strip possible markdown code fences
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

// ─── Provider 2: Groq ─────────────────────────────────────────────────────────

async function tryGroq(text: string, url: string, baseJob: ScrapedJob): Promise<ScrapedJob | null> {
    if (!GROQ_KEY) return null;
    try {
        console.log(`🧠 [AI Scraper] Groq → ${url.slice(0, 55)}...`);
        const { data } = await axios.post(
            'https://api.groq.com/openai/v1/chat/completions',
            {
                model: 'llama-3.1-8b-instant',  // 14,400 req/day free
                messages: [{ role: 'user', content: buildPrompt(text) }],
                temperature: 0.1,
                max_tokens: 1024,
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
        const isQuota = err?.response?.status === 429;
        console.warn(`⚠️ [AI Scraper] Groq failed${isQuota ? ' (quota)' : ''}: ${err.message?.slice(0, 80)}`);
        return null;
    }
}

// ─── Provider 3: OpenRouter ───────────────────────────────────────────────────

async function tryOpenRouter(text: string, url: string, baseJob: ScrapedJob): Promise<ScrapedJob | null> {
    if (!OPENROUTER_KEY) return null;
    try {
        console.log(`🧠 [AI Scraper] OpenRouter → ${url.slice(0, 55)}...`);
        const { data } = await axios.post(
            'https://openrouter.ai/api/v1/chat/completions',
            {
                model: 'meta-llama/llama-3.1-8b-instruct:free',
                messages: [{ role: 'user', content: buildPrompt(text) }],
                temperature: 0.1,
                max_tokens: 1024,
                response_format: { type: 'json_object' },
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
        const isQuota = err?.response?.status === 429;
        console.warn(`⚠️ [AI Scraper] OpenRouter failed${isQuota ? ' (quota)' : ''}: ${err.message?.slice(0, 80)}`);
        return null;
    }
}

// ─── Public entry point ───────────────────────────────────────────────────────

export async function aiScrapeJob(htmlText: string, url: string, baseJob: ScrapedJob): Promise<ScrapedJob> {
    if (!GEMINI_KEY && !GROQ_KEY && !OPENROUTER_KEY) {
        console.warn('⚠️ [AI Scraper] No AI provider keys configured — skipping fallback.');
        return baseJob;
    }

    // Waterfall: try each provider in order, stop at first success
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
