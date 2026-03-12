import mongoose, { Schema, Document } from 'mongoose';

export interface IBotStat extends Document {
    date: string; // Format: YYYY-MM-DD
    jobsAdded: number;
    anomaliesFound: number;
    fixesMade: number;
    hallucinationsCaught: number;
    approvals: number;
    jobsArchived: number;
}

const botStatSchema = new Schema({
    date: { type: String, required: true, unique: true },
    jobsAdded: { type: Number, default: 0 },
    anomaliesFound: { type: Number, default: 0 },
    fixesMade: { type: Number, default: 0 },
    hallucinationsCaught: { type: Number, default: 0 },
    approvals: { type: Number, default: 0 },
    jobsArchived: { type: Number, default: 0 },
}, {
    timestamps: true
});

// Helper method to get today's stats, or create if missing
botStatSchema.statics.getToday = async function () {
    const today = new Date().toISOString().split('T')[0];
    let stat = await this.findOne({ date: today });
    if (!stat) {
        stat = await this.create({ date: today });
    }
    return stat;
};

// Helper method to increment a specific metric for today
botStatSchema.statics.incrementMetric = async function (metric: keyof IBotStat, amount: number = 1) {
    const today = new Date().toISOString().split('T')[0];
    const update: any = {};
    update[metric] = amount;
    return await this.findOneAndUpdate(
        { date: today },
        { $inc: update },
        { returnDocument: 'after', upsert: true }
    );
};

export default mongoose.models.BotStat || mongoose.model<IBotStat>('BotStat', botStatSchema);
