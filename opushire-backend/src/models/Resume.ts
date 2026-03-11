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
    extraData?: {
        skillGaps?: string[];
        learningPath?: Array<{ skill: string; steps: string[] }>;
        certifications?: string[];
        linkedin?: string;
        [key: string]: any; // Allow for flexible AI additions
    };
    fullParsedJSON?: any;
    score?: number;
    scoreBreakdown?: string[];
    matched: boolean;
    matches: IResumeMatch[];
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

export default mongoose.model<IResume>('Resume', ResumeSchema);
