import { safeGeminiCall } from './gemini.client';
import { normalizeSkills } from '../../utils/skillNormalizer';
import { IParsedData } from '../../models/Resume';

export async function parseResumeWithLLM(resumeText: string): Promise<{ parsedData: IParsedData, extraData: any, fullParsedJSON: any }> {
    const prompt = `
Extract candidate information from the following resume text and format it strictly as a JSON object.
Ensure no markdown formatting or backticks surround the JSON in your response. just output raw valid JSON.

Required Keys:
- "name": (string or null) The candidate's full name.
- "skills": (array of strings) Technical tools, languages, frameworks.
- "education": (array of strings) Degrees, schools, or academic highlights.
- "projects": (array of strings) Notable projects build by the candidate.
- "experience_level": (string or null) Must be "intern", "fresher", "junior", or null based on their background.
- "domains": (array of strings) e.g., ["Web Development", "Machine Learning", "Cloud Computing"].

You may extract any other relevant information into additional custom keys (e.g., "certifications", "links", "languages").

Resume Text:
${resumeText}
`;

    const text = await safeGeminiCall(prompt);

    let full: any = {};
    try {
        full = JSON.parse(text);
    } catch (e) {
        console.error("Failed to parse Gemini output as JSON", e);
        throw new Error("Resume Parsing Failed: Invalid JSON returned by LLM");
    }

    // Normalize extracted skills
    const rawSkills = Array.isArray(full.skills) ? full.skills : [];
    const normalizedSkills = await normalizeSkills(rawSkills);

    const parsedData: IParsedData = {
        name: full.name || null,
        skills: normalizedSkills,
        education: Array.isArray(full.education) ? full.education : [],
        projects: Array.isArray(full.projects) ? full.projects : [],
        experience_level: full.experience_level || null,
        domains: Array.isArray(full.domains) ? full.domains : []
    };

    const knownKeys = new Set([
        "name", "skills", "education", "projects", "experience_level", "domains"
    ]);

    const extraData: any = {};
    for (const k in full) {
        if (!knownKeys.has(k)) {
            extraData[k] = full[k];
        }
    }

    return { parsedData, extraData, fullParsedJSON: full };
}
