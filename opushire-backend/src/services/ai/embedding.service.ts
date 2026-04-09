import { embeddingModel } from './gemini.client';

// Gemini embedding-001 dimension size
const EMBEDDING_DIM = 768;

export async function embedText(text: string): Promise<number[]> {
    // Guard: Gemini throws 400 "empty Part" if text is blank
    const cleaned = (text || '').trim();
    if (!cleaned) {
        console.warn('⚠️ [Embedding] Skipped — empty text provided. Returning zero-vector.');
        return new Array(EMBEDDING_DIM).fill(0);
    }

    try {
        const response = await embeddingModel.embedContent(cleaned);
        return response.embedding.values;
    } catch (e) {
        console.error("Embedding generation failed:", e);
        throw new Error("Failed to generate vector embedding from text.");
    }
}
