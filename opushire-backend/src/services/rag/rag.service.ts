import BotExample from '../../models/BotExample';
import { embedText } from '../ai/embedding.service';
import { log, logError } from '../../utils/logger';
import { cosineSimilarity } from '../../utils/math';
import { QdrantClient } from '@qdrant/js-client-rest';
import { env } from '../../config/env';

// ─── Qdrant collection for RAG examples ──────────────────────────
const RAG_COLLECTION = 'opushire-rag-examples';
let qdrantClient: QdrantClient | null = null;

async function getQdrant(): Promise<QdrantClient | null> {
    if (qdrantClient) return qdrantClient;
    if (!env.VECTOR_DB_URL) return null;
    try {
        qdrantClient = new QdrantClient({ url: env.VECTOR_DB_URL, apiKey: env.VECTOR_DB_API_KEY });
        const colls = await qdrantClient.getCollections();
        if (!colls.collections.some(c => c.name === RAG_COLLECTION)) {
            await qdrantClient.createCollection(RAG_COLLECTION, {
                vectors: { size: 768, distance: 'Cosine' },
            });
            log('RAG', `Created Qdrant collection: ${RAG_COLLECTION}`);
        }
        return qdrantClient;
    } catch (err) {
        logError('RAG', 'Qdrant init failed — falling back to MongoDB brute-force', err);
        return null;
    }
}

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
  // Don't store examples with empty text — would corrupt the embedding index
  if (!input?.trim() || !output?.trim()) {
    log('RAG', `Skipped empty example for ${botId}`);
    return;
  }
  try {
    const embedding = await embedText(input);
    const doc = await BotExample.create({ botId, input, output, embedding });

    // Also upsert into Qdrant for O(log n) ANN retrieval
    const qd = await getQdrant();
    if (qd) {
        const id = doc._id.toString();
        const hash = Buffer.from(id).toString('hex').padEnd(32, '0').slice(0, 32);
        const uuid = `${hash.slice(0,8)}-${hash.slice(8,12)}-4000-8000-${hash.slice(20,32)}`;
        await qd.upsert(RAG_COLLECTION, {
            wait: false,
            points: [{ id: uuid, vector: embedding, payload: { botId, input, output, mongoId: id } }],
        });
    }

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

    // ── Strategy 1: Use Qdrant ANN (O(log n)) if available ──
    const qd = await getQdrant();
    if (qd) {
        const results = await qd.search(RAG_COLLECTION, {
            vector: queryVec,
            limit: k,
            with_payload: true,
            filter: { must: [{ key: 'botId', match: { value: botId } }] },
        });

        if (results.length > 0) {
            log('RAG', `Retrieved ${results.length} examples via Qdrant ANN for ${botId} (top score: ${results[0].score.toFixed(3)})`);
            return results.map(hit => ({
                input: (hit.payload?.input as string) || '',
                output: (hit.payload?.output as string) || '',
            }));
        }
    }

    // ── Strategy 2: Fallback to MongoDB brute-force (O(n)) ──
    const candidates = await BotExample.find({ botId })
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();

    if (candidates.length === 0) return [];

    const scored = candidates
      .filter((c: any) => c.embedding && c.embedding.length === queryVec.length)
      .map((c: any) => ({
        input: c.input,
        output: c.output,
        score: cosineSimilarity(queryVec, c.embedding),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, k);

    log('RAG', `Retrieved ${scored.length} examples via MongoDB fallback for ${botId} (top score: ${scored[0]?.score.toFixed(3)})`);
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


