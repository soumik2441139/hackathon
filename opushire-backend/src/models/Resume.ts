import mongoose, { Document, Schema } from 'mongoose';

export interface IResumeMatch {
    job: mongoose.Types.ObjectId;
    rerankScore: number;
    explanation: string;
}

export interface IParsedData {
    name: string | null;
    skills: string[];
    education: string[];
    projects: string[];
    experience_level: string | null;
    domains: string[];
}

export interface IResume extends Document {
    userId: mongoose.Types.ObjectId;
    fileUrl: string;
    rawText: string;
    parsedData?: IParsedData;
    markdownSource?: string;
    extraData?: {
        skillGaps?: string[];
        learningPath?: Array<{ skill: string; steps: string[] }>;
        certifications?: string[];
        linkedin?: string;
        [key: string]: unknown; // Allow for flexible AI additions
    };
    fullParsedJSON?: unknown;
    score?: number;
    scoreBreakdown?: string[];
    matched: boolean;
    matches: IResumeMatch[];
    format: string;
    sourceType: 'markdown' | 'latex';
    latexSource?: string;
    createdAt: Date;

    updatedAt: Date;
}

const MatchSchema = new Schema<IResumeMatch>({
    job: { type: Schema.Types.ObjectId, ref: 'Job' },
    rerankScore: { type: Number },
    explanation: { type: String }
}, { _id: false });

const ResumeSchema = new Schema<IResume>({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    fileUrl: { type: String, required: true },
    rawText: { type: String, required: true },
    format: { type: String, default: 'pdf' },
    
    sourceType: { type: String, enum: ['markdown', 'latex'], default: 'markdown' },
    markdownSource: { type: String },
    latexSource: { type: String },
    
    parsedData: {
        name: { type: String, default: null },
        skills: [{ type: String }],
        education: [{ type: String }],
        projects: [{ type: String }],
        experience_level: { type: String, default: null },
        domains: [{ type: String }]
    },
    
    extraData: {

        type: Map,
        of: Schema.Types.Mixed
    },
    
    fullParsedJSON: { type: Schema.Types.Mixed },
    
    score: { type: Number, default: 0 },
    scoreBreakdown: [{ type: String }],
    
    matched: { type: Boolean, default: false },
    matches: [MatchSchema]

}, { timestamps: true });

// ─── Compound indexes ─────────────────────────────────────────────────────────
// match-resumes worker: find unprocessed uploaded resumes quickly
ResumeSchema.index({ matched: 1, userId: 1 });
// Career advisor: check if user already has a learning path
ResumeSchema.index({ userId: 1, 'extraData.learningPath': 1 }, { sparse: true });

export default mongoose.model<IResume>('Resume', ResumeSchema);
