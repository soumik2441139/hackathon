import mongoose from 'mongoose';

/**
 * 3-Tier Agent Memory System
 *
 * Working Memory — short-lived, current-task context (TTL: 1 hour)
 * Episodic Memory — records of past actions & outcomes (TTL: 30 days)
 * Semantic Memory — distilled knowledge & learned rules (permanent)
 */

// ─── Working Memory ──────────────────────────────────────────────
// Current task context, cleared after each session

const WorkingMemorySchema = new mongoose.Schema({
  agentId: { type: String, required: true, index: true },
  key: { type: String, required: true },
  value: { type: mongoose.Schema.Types.Mixed, required: true },
  createdAt: { type: Date, default: Date.now, index: { expireAfterSeconds: 3600 } }, // TTL: 1 hour
});
WorkingMemorySchema.index({ agentId: 1, key: 1 }, { unique: true });

export const WorkingMemory = mongoose.model('WorkingMemory', WorkingMemorySchema);

// ─── Episodic Memory ─────────────────────────────────────────────
// Records of what the agent did and what happened

const EpisodicMemorySchema = new mongoose.Schema({
  agentId: { type: String, required: true, index: true },
  action: { type: String, required: true },    // What the agent did
  context: { type: String },                    // What the input was
  outcome: { type: String, required: true },    // What happened (success/failure/result)
  success: { type: Boolean, required: true },
  metadata: { type: mongoose.Schema.Types.Mixed },
  embedding: { type: [Number], default: [] },   // For semantic retrieval
  createdAt: { type: Date, default: Date.now, index: { expireAfterSeconds: 30 * 24 * 60 * 60 } }, // TTL: 30 days
});
EpisodicMemorySchema.index({ agentId: 1, success: 1, createdAt: -1 });

export const EpisodicMemory = mongoose.model('EpisodicMemory', EpisodicMemorySchema);

// ─── Semantic Memory ─────────────────────────────────────────────
// Distilled knowledge, learned patterns, permanent

const SemanticMemorySchema = new mongoose.Schema({
  agentId: { type: String, required: true, index: true },
  rule: { type: String, required: true },        // The learned rule/insight
  confidence: { type: Number, default: 1.0 },    // How confident (adjusts over time)
  source: { type: String },                       // Where this knowledge came from
  usageCount: { type: Number, default: 0 },       // How often this rule has been used
  lastUsed: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});
SemanticMemorySchema.index({ agentId: 1, confidence: -1 });

export const SemanticMemory = mongoose.model('SemanticMemory', SemanticMemorySchema);
