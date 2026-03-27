import { GoogleGenerativeAI } from '@google/generative-ai';
import { geminiBreaker, groqBreaker } from '../../utils/circuitBreaker';

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
    return groqBreaker.exec(async () => {
        const groqApi = process.env.GROQ_API_KEY;
        if (!groqApi) throw new Error('GROQ_API_KEY is not defined');
        
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${groqApi}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [{ role: 'user', content: prompt }]
            })
        });

        const r = await response.json();
        if (!response.ok) {
            throw new Error(r.error?.message || `Groq failed with status ${response.status}`);
        }

        let text = r.choices[0].message.content.trim();
        // Clean markdown wrapping
        if (text.startsWith('```json')) text = text.replace(/```json/g, '').replace(/```/g, '').trim();
        else if (text.startsWith('```')) text = text.replace(/```/g, '').trim();
        return text;
    });
}
