/**
 * Cosine similarity between two equal-length numeric vectors.
 * Returns 0 if either vector has zero magnitude (avoids division by zero / NaN).
 *
 * Used by:
 *  - RAG Service (few-shot example retrieval)
 *  - Agent Memory (episodic recall)
 *  - Unit tests (cosineSimilarity.test.ts)
 */
export function cosineSimilarity(a: number[], b: number[]): number {
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < a.length; i++) {
        dot += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }
    const denom = Math.sqrt(normA) * Math.sqrt(normB);
    return denom === 0 ? 0 : dot / denom;
}
