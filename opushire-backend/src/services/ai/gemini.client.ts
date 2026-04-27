import { GoogleGenerativeAI } from '@google/generative-ai';
import { geminiBreaker, groqBreaker } from '../../utils/circuitBreaker';
import { llmLatency } from '../../metrics/business.metrics';
import { log, logError } from '../../utils/logger';
import { env } from '../../config/env';
import axios from 'axios';

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

export const geminiModel = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash'
});

export const embeddingModel = genAI.getGenerativeModel({
    model: 'gemini-embedding-001'
});

/**
 * Safe wrapper with strict Multi-Provider Fallback Routing.
 * 1. OpenRouter (Free models auto-routed)
 * 2. Groq (Llama-3)
 * 3. Gemini (Native SDK)
 */
export async function safeGeminiCall(prompt: string): Promise<string> {
    const cleanText = (text: string) => {
        text = text.trim();
        if (text.startsWith('```json')) return text.replace(/```json/g, '').replace(/```/g, '').trim();
        if (text.startsWith('```')) return text.replace(/```/g, '').trim();
        return text;
    };

    try {
        // Attempt 1: OpenRouter Auto Free Tier
        const openRouterApi = env.OPENROUTER_API_KEY;
        if (!openRouterApi) throw new Error('OPENROUTER_API_KEY is not defined');

        const endTimer = llmLatency.startTimer({ model: 'openrouter/auto' });
        const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
            model: 'openrouter/auto',
            messages: [{ role: 'user', content: prompt }]
        }, {
            headers: {
                'Authorization': `Bearer ${openRouterApi}`,
                'HTTP-Referer': env.FRONTEND_URL,
                'X-Title': 'OpusHire',
                'Content-Type': 'application/json'
            },
            timeout: 15000
        });
        endTimer({ status: 'success' });
        return cleanText(response.data.choices[0].message.content);
    } catch (openRouterErr: any) {
        logError('LLM_ROUTER', `OpenRouter failed → falling back to Groq`, openRouterErr);
        
        try {
            // Attempt 2: Groq Fallback
            return await groqBreaker.exec(async () => {
                const groqApi = env.GROQ_API_KEY;
                if (!groqApi) throw new Error('GROQ_API_KEY is not defined');
                
                const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
                    model: 'llama-3.3-70b-versatile',
                    messages: [{ role: 'user', content: prompt }]
                }, {
                    headers: { 'Authorization': `Bearer ${groqApi}`, 'Content-Type': 'application/json' },
                    timeout: 10000
                });

                return cleanText(response.data.choices[0].message.content);
            });
        } catch (groqErr: any) {
            logError('LLM_ROUTER', `Groq failed → falling back to Gemini Native`, groqErr);
            
            // Attempt 3: Gemini Native Fallback
            return await geminiBreaker.exec(async () => {
                const res = await geminiModel.generateContent(prompt);
                return cleanText(res.response.text());
            });
        }
    }
}
