import { safeGeminiCall } from './gemini.client';
import { IParsedData } from '../../models/Resume';
import { IJob } from '../../models/Job'; // Assuming standard job structure

export async function explainMatch(candidate: IParsedData, job: any): Promise<string> {
    const prompt = `
Act as an expert technical recruiter analyzing a candidate match.
Below is the candidate's parsed profile and a target job.

Candidate: ${JSON.stringify(candidate)}
Job Title: ${job.title}
Job Description: ${job.description}

Generate a strict JSON response containing an explanation of why this candidate is a good (or bad) fit for this role.
Do not wrap it in markdown block quotes (\`\`\`json). Just return the raw JSON.

Required format:
{
  "match_score": <number 0-100>,
  "matched_skills": [<strings>],
  "missing_skills": [<strings>],
  "reason": <short 1-2 sentence compelling reason string>
}
`;

    try {
        return await safeGeminiCall(prompt);
    } catch (e) {
        console.error("Match LLM Explanation Failed:", e);
        return JSON.stringify({ match_score: 0, reason: "Error generating explanation" });
    }
}
