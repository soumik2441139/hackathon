import axios from 'axios';
import { NormalizedJob } from './remotive.provider'; // Shares schema

const GROQ_API_KEY = process.env.GROQ_API_KEY || '';

// High-speed RegExp filter for obvious garbage (zero API cost)
const SPAM_REGEX = /\b(commission only|mlm|pyramid scheme|100% commission|crypto scheme|work from home scam|pay to work|click farm|earn money fast|survey|no base pay)\b/i;

export async function filterSpamJobs(jobs: NormalizedJob[]): Promise<NormalizedJob[]> {
    console.log(`🛡️ [Spam Filter] Analyzing ${jobs.length} jobs for garbage/scams...`);

    const preFiltered = jobs.filter(job => !SPAM_REGEX.test(job.description) && !SPAM_REGEX.test(job.title));
    console.log(`🛡️ [Spam Filter] Dropped ${jobs.length - preFiltered.length} via strict regex.`);

    if (preFiltered.length === 0 || !GROQ_API_KEY) {
        if (!GROQ_API_KEY) console.warn('⚠️ [Spam Filter] GROQ_API_KEY is missing! Using Regex only.');
        return preFiltered;
    }

    const BATCH_SIZE = 15;
    const finalLegitJobs: NormalizedJob[] = [];

    // Process using high-speed Llama-3-8b via Groq
    // We batch 15 jobs at a time to keep tokens low and avoid context window truncate issues
    for (let i = 0; i < preFiltered.length; i += BATCH_SIZE) {
        const batch = preFiltered.slice(i, i + BATCH_SIZE);
        const summaries = batch.map((j, idx) => `ID ${idx}: [${j.company}] ${j.title} - ${j.description.substring(0, 50)}`).join('\n');

        const prompt = `
You are an expert tech recruiter SPAM checker.
Analyze these job postings. Some may be literal scams, MLM pyramid schemes, non-engineering manual labor, or entirely gibberish.
We strictly only want legitimate software engineering, design, and IT jobs (Junior, Intern, or Mid level is fine).

Jobs:
${summaries}

Return ONLY a perfectly formatted JSON array of the IDs that are 100% LEGIT. Example: [0, 1, 3]
Do not return markdown, do not return explanations. Just the JSON array.
        `.trim();

        try {
            const { data } = await axios.post(
                'https://api.groq.com/openai/v1/chat/completions',
                {
                    model: 'llama3-8b-8192',
                    messages: [{ role: 'user', content: prompt }],
                    temperature: 0.1,
                    response_format: { type: 'json_object' } // Groq JSON mode
                },
                {
                    headers: { 'Authorization': `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
                    timeout: 10000
                }
            );

            const aiContent = data.choices[0]?.message?.content || '{"legit":[]}';
            let legitIds: number[] = [];
            
            try {
                // Handle arbitrary JSON array format or { "legit": [0,1] } from prompt alignment drift
                const parsed = JSON.parse(aiContent);
                if (Array.isArray(parsed)) legitIds = parsed;
                else if (parsed.legit && Array.isArray(parsed.legit)) legitIds = parsed.legit;
                else if (parsed.ids && Array.isArray(parsed.ids)) legitIds = parsed.ids;
            } catch (pErr) {
                console.error('🛡️ [Spam Filter] Failed to parse Llama-3 output:', aiContent);
                legitIds = batch.map((_, idx) => idx); // Fail-open on strict parser errors
            }

            legitIds.forEach(id => {
                if (batch[id]) finalLegitJobs.push(batch[id]);
            });

        } catch (err: any) {
            console.error('❌ [Spam Filter] Groq API call failed, bypassing filter slice:', err.message);
            finalLegitJobs.push(...batch); // Fail-open so we don't drop legitimate jobs if API is down
        }
    }

    console.log(`✅ [Spam Filter] AI Approved ${finalLegitJobs.length} pristine tech jobs.`);
    return finalLegitJobs;
}
