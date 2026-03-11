import { embeddingModel } from './gemini.client';

export async function embedText(text: string): Promise<number[]> {
    try {
        const response = await embeddingModel.embedContent(text);
        return response.embedding.values;
    } catch (e) {
        console.error("Embedding generation failed:", e);
        throw new Error("Failed to generate vector embedding from text.");
    }
}
