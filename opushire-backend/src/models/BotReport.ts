import mongoose, { Schema, Document } from 'mongoose';

export interface IBotAction {
    timestamp: Date;
    action: string;
    count: number;
}

export interface IBotReport extends Document {
    date: string;          // "2026-03-10"
    botId: string;         // "bot1-scanner"
    botName: string;       // "Scanner"
    actions: IBotAction[];
    summary: {
        totalActions: number;
        jobsProcessed: number;
        errors: number;
    };
    createdAt: Date;
    updatedAt: Date;
}

const BotReportSchema = new Schema<IBotReport>(
    {
        date: { type: String, required: true },
        botId: { type: String, required: true },
        botName: { type: String, required: true },
        actions: [{
            timestamp: { type: Date, default: Date.now },
            action: { type: String, required: true },
            count: { type: Number, default: 0 }
        }],
        summary: {
            totalActions: { type: Number, default: 0 },
            jobsProcessed: { type: Number, default: 0 },
            errors: { type: Number, default: 0 }
        }
    },
    { timestamps: true }
);

// Compound index: one report per bot per day
BotReportSchema.index({ date: 1, botId: 1 }, { unique: true });
// Cleanup index: TTL after 8 days
BotReportSchema.index({ createdAt: 1 }, { expireAfterSeconds: 8 * 24 * 60 * 60 });

/**
 * Log an action for a specific bot on today's report.
 * Creates the report document if it doesn't exist yet.
 */
BotReportSchema.statics.logAction = async function (
    botId: string,
    botName: string,
    action: string,
    count: number = 0
) {
    const today = new Date().toISOString().split('T')[0];
    return await this.findOneAndUpdate(
        { date: today, botId },
        {
            $setOnInsert: { botName },
            $push: {
                actions: { timestamp: new Date(), action, count }
            },
            $inc: {
                'summary.totalActions': 1,
                'summary.jobsProcessed': count
            }
        },
        { upsert: true, returnDocument: 'after' }
    );
};

/**
 * Log an error for a specific bot on today's report.
 */
BotReportSchema.statics.logError = async function (
    botId: string,
    botName: string,
    errorMessage: string
) {
    const today = new Date().toISOString().split('T')[0];
    return await this.findOneAndUpdate(
        { date: today, botId },
        {
            $setOnInsert: { botName },
            $push: {
                actions: { timestamp: new Date(), action: `❌ ERROR: ${errorMessage}`, count: 0 }
            },
            $inc: {
                'summary.totalActions': 1,
                'summary.errors': 1
            }
        },
        { upsert: true, returnDocument: 'after' }
    );
};

export default mongoose.models.BotReport || mongoose.model<IBotReport>('BotReport', BotReportSchema);
