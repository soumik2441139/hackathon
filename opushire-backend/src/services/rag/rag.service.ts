import BotExample from '../../models/BotExample';
import { embedText } from '../ai/embedding.service';
import { log, logError } from '../../utils/logger';

/**
 * RAG Service for Bots
 *
 * Stores successful bot input/output pairs with vector embeddings,
 * then retrieves the most similar past examples to inject as few-shot
 * context into future LLM prompts.
 *
 * Flow:
 *   1. Bot makes a decision (e.g. fixer generates keywords)
 *   2. If supervisor approves → call storeExample() to persist it
 *   3. Next time fixer runs → call getExamples() to get similar past decisions
 *   4. Inject them into the prompt as few-shot examples
 */

// ─── Store a successful example ──────────────────────────────────

export async function storeExample(
  botId: string,
  input: string,
  output: string,
): Promise<void> {
  try {
    const embedding = await embedText(input);
    await BotExample.create({ botId, input, output, embedding });
    log('RAG', `Stored example for ${botId} (${input.substring(0, 50)}...)`);
  } catch (err) {
    logError('RAG', 'Failed to store example', err);
  }
}

// ─── Retrieve similar examples for few-shot prompting ────────────

export async function getExamples(
  botId: string,
  queryText: string,
  k: number = 3,
): Promise<{ input: string; output: string }[]> {
  try {
    const queryVec = await embedText(queryText);

    // Get all examples for this bot (capped at 200 most recent)
    const candidates = await BotExample.find({ botId })
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();

    if (candidates.length === 0) return [];

    // Compute cosine similarity and sort
    const scored = candidates
      .filter((c: any) => c.embedding && c.embedding.length === queryVec.length)
      .map((c: any) => ({
        input: c.input,
        output: c.output,
        score: cosineSimilarity(queryVec, c.embedding),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, k);

    log('RAG', `Retrieved ${scored.length} examples for ${botId} (top score: ${scored[0]?.score.toFixed(3)})`);
    return scored.map(({ input, output }) => ({ input, output }));
  } catch (err) {
    logError('RAG', 'Failed to retrieve examples', err);
    return [];
  }
}

// ─── Build few-shot prompt section ───────────────────────────────

export function buildFewShotSection(examples: { input: string; output: string }[]): string {
  if (examples.length === 0) return '';

  let section = '\n\nHere are examples of past successful decisions:\n';
  for (const ex of examples) {
    section += `\nInput: ${ex.input}\nOutput: ${ex.output}\n---`;
  }
  section += '\n\nNow handle the current case:\n';
  return section;
}

// ─── Cosine similarity ──────────────────────────────────────────

function cosineSimilarity(a: number[], b: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dotProduct / denom;
}
