import axios from 'axios';
import { CandidateProfile } from './candidate.service';
import { RawJob } from './jobFetcher.service';
import { log, logError } from '../utils/logger';

export interface ScoredJob {
    rank: number;
    score: number;                // 0-100
    title: string;
    company: string;
    location: string;
    remote: boolean;
    matched_skills: string[];
    missing_skills: string[];
    seniority: string;
    apply_url: string;
    source: string;
    fetched_at: string;           // ISO timestamp
}

const SYSTEM_PROMPT = `You are a job matching agent for OpusHire, a career platform for junior developers and interns in India.

You will receive:
1. A candidate profile (skills, domains, experience level, preferred roles, location)
2. A list of raw job listings fetched from LinkedIn, Indeed, and Naukri

Your job is to score, filter, and rank the listings against the candidate profile.

## MATCHING LOGIC
For each job:
1. Score relevance (0–100) based on:
   - Title alignment with preferred roles (0–25 pts)
   - Skill overlap with candidate skills (0–30 pts)
   - Seniority match: intern/junior/entry-level (0–15 pts)
   - Domain match (0–15 pts)
   - Location/remote compatibility (0–10 pts)
   - Recency (0–5 pts)
2. Discard jobs scoring below 40
3. Return top 10 matches sorted by score descending

## OUTPUT FORMAT
Return ONLY a valid JSON array. No markdown. No explanation. No extra text outside the JSON.

[
  {
    "rank": 1,
    "score": 87,
    "title": "Junior Software Engineer",
    "company": "Razorpay",
    "location": "Bangalore, India",
    "remote": false,
    "matched_skills": ["Node.js", "MongoDB"],
    "missing_skills": ["Go"],
    "seniority": "Junior",
    "apply_url": "https://...",
    "source": "linkedin",
    "fetched_at": "2026-04-02T00:00:00.000Z"
  }
]

If zero jobs pass the threshold, return exactly: []

## RULES
- Only score jobs from the input. Never invent or hallucinate listings.
- Use apply_url as the unique key. Skip jobs with no apply_url.
- Be strict. A bad match hurts the candidate. When in doubt, score lower.`;

/**
 * Sends candidate profile + raw jobs to OpenRouter (free model).
 * Returns scored, filtered, ranked job matches.
 */
export async function antigravityScore(
    profile: CandidateProfile,
    rawJobs: RawJob[],
): Promise<ScoredJob[]> {
    if (rawJobs.length === 0) return [];

    const openRouterKey = process.env.OPENROUTER_API_KEY;
    if (!openRouterKey) {
        log('ANTIGRAVITY', 'OPENROUTER_API_KEY missing — skipping AI scoring');
        return [];
    }

    // Trim job data to reduce tokens — only pass fields the LLM needs
    const trimmedJobs = rawJobs.slice(0, 50).map(j => ({
        title:        j.title,
        company:      j.company,
        location:     j.location,
        remote:       j.is_remote,
        source:       j.site,
        apply_url:    j.job_url,
        fetched_at:   j.date_posted || new Date().toISOString(),
        description:  typeof j.description === 'string'
                        ? j.description.slice(0, 300)   // trim to 300 chars per job
                        : '',
    }));

    const userMessage = `Candidate Profile:\n${JSON.stringify(profile, null, 2)}\n\nJob Listings (${trimmedJobs.length} total):\n${JSON.stringify(trimmedJobs, null, 2)}`;

    try {
        const response = await axios.post(
            'https://openrouter.ai/api/v1/chat/completions',
            {
                model: 'meta-llama/llama-3.1-8b-instruct:free',
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT },
                    { role: 'user',   content: userMessage },
                ],
                temperature: 0.1,    // low temp for consistent JSON
                max_tokens:  4096,
            },
            {
                headers: {
                    'Authorization': `Bearer ${openRouterKey}`,
                    'HTTP-Referer':  process.env.FRONTEND_URL || 'http://localhost:3000',
                    'X-Title':       'OpusHire Antigravity',
                    'Content-Type':  'application/json',
                },
                timeout: 30000,
            },
        );

        const raw = response.data.choices[0]?.message?.content || '[]';
        const cleaned = raw
            .trim()
            .replace(/^```json\s*/i, '')
            .replace(/^```\s*/,      '')
            .replace(/\s*```$/,      '')
            .trim();

        let parsed: ScoredJob[];
        try {
            parsed = JSON.parse(cleaned);
            if (!Array.isArray(parsed)) parsed = [];
        } catch {
            log('ANTIGRAVITY', `Failed to parse LLM JSON output: ${cleaned.slice(0, 200)}`);
            parsed = [];
        }

        // Extra safety: clamp scores, ensure required fields exist
        return parsed
            .filter(j => j.apply_url && j.title && j.score >= 40)
            .map((j, idx) => ({
                ...j,
                rank:  idx + 1,
                score: Math.min(100, Math.max(0, Math.round(j.score))),
            }))
            .sort((a, b) => b.score - a.score)
            .slice(0, 10);

    } catch (err: any) {
        logError('ANTIGRAVITY', `OpenRouter call failed`, err);
        return [];
    }
}
