import { GoogleGenerativeAI } from '@google/generative-ai';
import { geminiBreaker } from '../../utils/circuitBreaker';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export const geminiModel = genAI.getGenerativeModel({
    model: 'gemini-1.5-pro'
});

export const embeddingModel = genAI.getGenerativeModel({
    model: 'text-embedding-004'
});

/**
 * Safe wrapper for Gemini generateContent with circuit breaker.
 * Use this instead of calling geminiModel.generateContent() directly.
 */
export async function safeGeminiCall(prompt: string): Promise<string> {
    return geminiBreaker.exec(async () => {
        const r = await geminiModel.generateContent(prompt);
        let text = r.response.text().trim();
        // Clean markdown wrapping
        if (text.startsWith('```json')) text = text.replace(/```json/g, '').replace(/```/g, '').trim();
        else if (text.startsWith('```')) text = text.replace(/```/g, '').trim();
        return text;
    });
}
