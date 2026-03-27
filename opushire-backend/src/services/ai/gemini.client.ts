import { GoogleGenerativeAI } from '@google/generative-ai';
import { geminiBreaker, groqBreaker } from '../../utils/circuitBreaker';
import axios from 'axios';

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
        
        const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
            model: 'llama-3.3-70b-versatile',
            messages: [{ role: 'user', content: prompt }]
        }, {
            headers: {
                'Authorization': `Bearer ${groqApi}`,
                'Content-Type': 'application/json'
            },
            timeout: 10000
        });

        const r = response.data;
        // axios throws an error for non-2xx status codes, so no need for !response.ok check here.

        let text = r.choices[0].message.content.trim();
        // Clean markdown wrapping
        if (text.startsWith('```json')) text = text.replace(/```json/g, '').replace(/```/g, '').trim();
        else if (text.startsWith('```')) text = text.replace(/```/g, '').trim();
        return text;
    });
}
