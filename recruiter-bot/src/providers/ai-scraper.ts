import { GoogleGenAI } from '@google/genai';
import { ScrapedJob } from './page-scraper';

const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey) {
    ai = new GoogleGenAI({ apiKey });
}

export async function aiScrapeJob(htmlText: string, url: string, baseJob: ScrapedJob): Promise<ScrapedJob> {
    if (!ai) {
        console.warn('⚠️ [AI Scraper] GEMINI_API_KEY not set. Skipping AI fallback.');
        return baseJob;
    }

    try {
        console.log(`🧠 [AI Scraper] Triggering Gemini Fallback for: ${url.slice(0, 60)}...`);

        // Clean out excessive whitespace to save tokens, though 1.5 flash handles 1M natively
        const cleanedText = htmlText.replace(/\s+/g, ' ').substring(0, 80000);

        const prompt = `
You are an expert technical recruiter data extractor mapping raw webpage text into structured JSON.
Extract the core responsibilities, requirements (qualifications), and any "nice-to-have" tags from the following text.
Strictly return a JSON object with this exact schema:
{
  "responsibilities": string[],
  "requirements": string[],
  "tags": string[]
}

Raw Text:
${cleanedText}
`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                temperature: 0.1 // keep it deterministic
            }
        });

        const textResponse = response.text;
        if (!textResponse) return baseJob;

        const parsed = JSON.parse(textResponse);
        console.log(`✅ [AI Scraper] Gemini successfully extracted data!`);

        return {
            ...baseJob,
            responsibilities: Array.isArray(parsed.responsibilities) && parsed.responsibilities.length > 0 ? parsed.responsibilities : baseJob.responsibilities,
            requirements: Array.isArray(parsed.requirements) && parsed.requirements.length > 0 ? parsed.requirements : baseJob.requirements,
            tags: Array.isArray(parsed.tags) && parsed.tags.length > 0 ? parsed.tags : baseJob.tags,
        };
    } catch (err: any) {
        console.error(`❌ [AI Scraper] Gemini fallback failed: ${err.message}`);
        return baseJob;
    }
}
