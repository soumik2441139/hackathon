import mongoose from 'mongoose';

/**
 * Stores successful bot decisions as few-shot examples for RAG.
 * When a bot (fixer/supervisor) makes a good decision, we store the
 * input/output pair so future LLM calls can reference similar past cases.
 */
const BotExampleSchema = new mongoose.Schema({
  botId: { type: String, required: true, index: true },
  input: { type: String, required: true },     // The original tags / requirements
  output: { type: String, required: true },     // The bot's successful output
  embedding: { type: [Number], default: [] },   // 768-dim vector for similarity search
  createdAt: { type: Date, default: Date.now, index: { expireAfterSeconds: 90 * 24 * 60 * 60 } }, // TTL: 90 days
});

BotExampleSchema.index({ botId: 1, createdAt: -1 });

export default mongoose.model('BotExample', BotExampleSchema);
