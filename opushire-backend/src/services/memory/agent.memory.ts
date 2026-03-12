import { WorkingMemory, EpisodicMemory, SemanticMemory } from '../../models/AgentMemory';
import { embedText } from '../ai/embedding.service';
import { safeGeminiCall } from '../ai/gemini.client';
import { log, logError } from '../../utils/logger';

/**
 * Agent Memory Service — 3-tier self-improving memory for AI agents.
 *
 * Tier 1: Working Memory (scratchpad) — current task context
 * Tier 2: Episodic Memory (diary) — past action → outcome records
 * Tier 3: Semantic Memory (wisdom) — distilled rules & learned patterns
 *
 * Usage in bot workers:
 *   1. Before processing: load relevant memories → inject into prompt
 *   2. After processing: record this action with outcome in episodic memory
 *   3. Periodically: distill episodic → semantic (learn from patterns)
 */

// ═══════════════════════════════════════════════════════════════════
// Tier 1: Working Memory
// ═══════════════════════════════════════════════════════════════════

export async function setWorkingMemory(agentId: string, key: string, value: any): Promise<void> {
  await WorkingMemory.findOneAndUpdate(
    { agentId, key },
    { value, createdAt: new Date() },
    { upsert: true, returnDocument: 'after' },
  );
}

export async function getWorkingMemory(agentId: string, key: string): Promise<any> {
  const doc = await WorkingMemory.findOne({ agentId, key });
  return doc?.value ?? null;
}

export async function clearWorkingMemory(agentId: string): Promise<void> {
  await WorkingMemory.deleteMany({ agentId });
}

// ═══════════════════════════════════════════════════════════════════
// Tier 2: Episodic Memory
// ═══════════════════════════════════════════════════════════════════

export async function recordEpisode(
  agentId: string,
  action: string,
  context: string,
  outcome: string,
  success: boolean,
  metadata?: any,
): Promise<void> {
  try {
    const embedding = await embedText(`${action} ${context}`);
    await EpisodicMemory.create({ agentId, action, context, outcome, success, metadata, embedding });
    log('AGENT_MEMORY', `Recorded episode for ${agentId}: ${action} → ${success ? 'success' : 'failure'}`);
  } catch (err) {
    logError('AGENT_MEMORY', 'Failed to record episode', err);
  }
}

export async function recallSimilarEpisodes(
  agentId: string,
  currentContext: string,
  k: number = 5,
): Promise<{ action: string; outcome: string; success: boolean }[]> {
  try {
    const queryVec = await embedText(currentContext);
    const episodes = await EpisodicMemory.find({ agentId })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    if (episodes.length === 0) return [];

    // Score by cosine similarity
    const scored = episodes
      .filter((e: any) => e.embedding?.length === queryVec.length)
      .map((e: any) => ({
        action: e.action,
        outcome: e.outcome,
        success: e.success,
        score: cosineSimilarity(queryVec, e.embedding),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, k);

    return scored;
  } catch (err) {
    logError('AGENT_MEMORY', 'Failed to recall episodes', err);
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════════
// Tier 3: Semantic Memory
// ═══════════════════════════════════════════════════════════════════

export async function addSemanticRule(
  agentId: string,
  rule: string,
  source: string = 'distilled',
): Promise<void> {
  await SemanticMemory.create({ agentId, rule, source });
  log('AGENT_MEMORY', `New semantic rule for ${agentId}: "${rule}"`);
}

export async function getSemanticRules(
  agentId: string,
  limit: number = 10,
): Promise<string[]> {
  const rules = await SemanticMemory.find({ agentId })
    .sort({ confidence: -1, usageCount: -1 })
    .limit(limit)
    .lean();

  // Increment usage count for retrieved rules
  const ids = rules.map((r: any) => r._id);
  if (ids.length > 0) {
    await SemanticMemory.updateMany(
      { _id: { $in: ids } },
      { $inc: { usageCount: 1 }, $set: { lastUsed: new Date() } },
    );
  }

  return rules.map((r: any) => r.rule);
}

// ═══════════════════════════════════════════════════════════════════
// Distillation: Episodic → Semantic
// ═══════════════════════════════════════════════════════════════════

/**
 * Analyzes recent episodic memories and distills patterns into
 * semantic rules using LLM. Run periodically (e.g. daily via cron).
 */
export async function distillMemories(agentId: string): Promise<string[]> {
  try {
    // Get last 50 episodes
    const episodes = await EpisodicMemory.find({ agentId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    if (episodes.length < 5) return []; // Not enough data to learn from

    const successes = episodes.filter((e: any) => e.success);
    const failures = episodes.filter((e: any) => !e.success);

    const prompt = `You are analyzing the performance history of an AI agent called "${agentId}".

Here are its recent SUCCESSFUL actions:
${successes.slice(0, 15).map((e: any) => `- Action: ${e.action} | Context: ${e.context} | Outcome: ${e.outcome}`).join('\n')}

Here are its recent FAILED actions:
${failures.slice(0, 15).map((e: any) => `- Action: ${e.action} | Context: ${e.context} | Outcome: ${e.outcome}`).join('\n')}

Based on this history, extract 3-5 concise rules or patterns that the agent should follow to improve its success rate.
Return ONLY a JSON array of strings, each being a rule. No markdown, just raw JSON.
Example: ["Always check X before Y", "Avoid Z pattern"]`;

    const text = await safeGeminiCall(prompt);
    let rules: string[] = [];
    try {
      rules = JSON.parse(text);
    } catch {
      logError('AGENT_MEMORY', 'Failed to parse distillation output');
      return [];
    }

    // Store new rules
    for (const rule of rules) {
      // Check for duplicate rules
      const existing = await SemanticMemory.findOne({ agentId, rule });
      if (existing) {
        // Boost confidence of existing rule
        existing.confidence = Math.min(existing.confidence + 0.1, 2.0);
        existing.updatedAt = new Date();
        await existing.save();
      } else {
        await addSemanticRule(agentId, rule, 'auto-distilled');
      }
    }

    log('AGENT_MEMORY', `Distilled ${rules.length} rules for ${agentId}`);
    return rules;
  } catch (err) {
    logError('AGENT_MEMORY', 'Distillation failed', err);
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════════
// Prompt Builder: Inject memories into LLM prompts
// ═══════════════════════════════════════════════════════════════════

export async function buildMemoryContext(
  agentId: string,
  currentTask: string,
): Promise<string> {
  const [rules, episodes] = await Promise.all([
    getSemanticRules(agentId, 5),
    recallSimilarEpisodes(agentId, currentTask, 3),
  ]);

  let context = '';

  if (rules.length > 0) {
    context += '\n[Learned Rules]\n';
    rules.forEach((r, i) => { context += `${i + 1}. ${r}\n`; });
  }

  if (episodes.length > 0) {
    context += '\n[Relevant Past Experiences]\n';
    for (const ep of episodes) {
      context += `- ${ep.action} → ${ep.outcome} (${ep.success ? 'success' : 'failure'})\n`;
    }
  }

  return context;
}

// ─── Utility ─────────────────────────────────────────────────────

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}
