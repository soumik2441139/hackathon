import axios from 'axios';

// Required interface for prompts
interface RouterOptions {
    systemPrompt: string;
    userPrompt: string;
    temperature?: number;
}

// Expected response from ALL models must include a confidence score
interface RouterResponse {
    data: any; // The actual extracted JSON data
    confidence_score: number; // 0-100 indicating extraction certainty
}

/**
 * AI Fallback Router
 * Instructs a fast, small model to parse data. If the confidence is < 85%,
 * it automatically re-routes the task to a massive, slow model.
 */
export async function routeAIExtraction(options: RouterOptions): Promise<any> {
    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) {
        throw new Error('GROQ_API_KEY is not defined in environment variables.');
    }

    // Step 1: The Fast Model (Llama 8B)
    console.log('[AI Router] 🚀 Querying Primary Fast Model (llama-3.1-8b-instant)...');
    try {
        const primaryResult = await queryGroq(
            'llama-3.1-8b-instant',
            options.systemPrompt,
            options.userPrompt,
            options.temperature
        );

        const parsedPrimary = parseResponse(primaryResult);

        if (parsedPrimary.confidence_score >= 85) {
            console.log(`[AI Router] ✅ Primary Model Success (Confidence: ${parsedPrimary.confidence_score}%)`);
            return parsedPrimary;
        } else {
            console.log(`[AI Router] ⚠️ Primary Model Low Confidence (${parsedPrimary.confidence_score}%). Escalating...`);
        }
    } catch (e: any) {
        console.log(`[AI Router] ❌ Primary Model Failed/Crashed (${e.message}). Escalating...`);
    }

    // Step 2: The Fallback Model (Llama-3.3-70B Versatile)
    console.log('[AI Router] 🛡️ Triggering Fallback Heavy Model (llama-3.3-70b-versatile)...');
    try {
        const fallbackResult = await queryGroq(
            'llama-3.3-70b-versatile',
            options.systemPrompt,
            options.userPrompt,
            0.2 // Lower temp for maximum strictness on fallback
        );

        const parsedFallback = parseResponse(fallbackResult);
        console.log(`[AI Router] ✅ Fallback Model Completed (Confidence: ${parsedFallback.confidence_score}%)`);
        return parsedFallback;
    } catch (e: any) {
        console.log(`[AI Router] ❌ Fallback Model Failed/Crashed (${e.message}).`);
        throw new Error('AI Router failed on all models.');
    }
}

async function queryGroq(model: string, systemPrompt: string, userPrompt: string, temperature = 0.5): Promise<string> {
    const response = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
            model: model,
            store: true, // required by Groq's updated API
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            response_format: { type: "json_object" },
            temperature: temperature
        },
        {
            headers: {
                'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            }
        }
    );

    return response.data.choices[0].message.content;
}

function parseResponse(rawJsonContent: string): any {
    try {
        const result = JSON.parse(rawJsonContent);
        // Ensure confidence score exists
        if (typeof result.confidence_score !== 'number') {
            result.confidence_score = 50; // Assume low if missing so it escalates
        }
        return result;
    } catch (e) {
        throw new Error('LLM did not return valid JSON: ' + rawJsonContent);
    }
}
