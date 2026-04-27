import { geminiModel } from './gemini.client';
import { logError } from '../../utils/logger';

export async function canonicalizeSkillsAI(skills: string[] = []): Promise<string[]> {
    if (!skills || skills.length === 0) return [];

    const prompt = `
Normalize these technical skills into standard professional names (e.g., "reactjs" -> "React", "node" -> "Node.js").
Return a strict JSON array of strings ONLY. Do not include markdown formatting or backticks.

${skills.join(", ")}
`;

    try {
        const res = await geminiModel.generateContent(prompt);
        let text = res.response.text().trim();
        
        // Strip markdown code blocks if the model includes them despite the prompt
        if (text.startsWith('```json')) {
            text = text.replace(/```json/g, '').replace(/```/g, '').trim();
        } else if (text.startsWith('```')) {
            text = text.replace(/```/g, '').trim();
        }

        const parsed = JSON.parse(text);
        if (Array.isArray(parsed)) {
            return parsed;
        }
        return skills;
    } catch (err) {
        logError('SKILL_CANON', 'Error canonicalizing skills', err);
        return skills; // Fallback to original
    }
}
