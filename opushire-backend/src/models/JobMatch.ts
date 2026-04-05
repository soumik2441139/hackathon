import mongoose, { Document, Schema } from 'mongoose';

export interface IJobMatch extends Document {
    candidateId: mongoose.Types.ObjectId;
    jobTitle: string;
    company: string;
    applyUrl: string;
    source: string;               // 'linkedin' | 'indeed' | 'naukri' | ...
    antigravityScore: number;     // 0–100 scored by OpenRouter
    matchedSkills: string[];
    missingSkills: string[];
    remote: boolean;
    location: string;
    seniority: string;            // 'Intern' | 'Junior' | 'Mid' (inferred)
    rawTitle: string;             // title before normalization
    fetchedAt: Date;
    sentToCandidate: boolean;     // for outreach pipeline
    expiresAt: Date;              // TTL — auto-purged after 30 days
    createdAt: Date;
    updatedAt: Date;
}

const JobMatchSchema = new Schema<IJobMatch>(
    {
        candidateId:      { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        jobTitle:         { type: String, required: true },
        company:          { type: String, required: true },
        applyUrl:         { type: String, required: true },
        source:           { type: String, required: true },
        antigravityScore: { type: Number, required: true, min: 0, max: 100 },
        matchedSkills:    [{ type: String }],
        missingSkills:    [{ type: String }],
        remote:           { type: Boolean, default: false },
        location:         { type: String, default: '' },
        seniority:        { type: String, default: 'Junior' },
        rawTitle:         { type: String, default: '' },
        fetchedAt:        { type: Date, default: Date.now },
        sentToCandidate:  { type: Boolean, default: false },
        // MongoDB TTL index — documents expire automatically after 30 days
        expiresAt:        { type: Date, default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
    },
    { timestamps: true },
);

// Auto-expire stale matches — MongoDB deletes the document when expiresAt is reached
JobMatchSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Unique per candidate+url — prevents same job being stored twice for same person
JobMatchSchema.index({ candidateId: 1, applyUrl: 1 }, { unique: true });

// Dashboard query: find all matches for a candidate, sorted by score
JobMatchSchema.index({ candidateId: 1, antigravityScore: -1 });

export const JobMatch = mongoose.model<IJobMatch>('JobMatch', JobMatchSchema);
