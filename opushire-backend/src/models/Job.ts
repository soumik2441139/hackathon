import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IJob extends Document {
    title: string;
    company: string;
    companyLogo: string;
    location: string;
    city: string;
    type: 'Internship' | 'Full-time' | 'Part-time' | 'Contract';
    mode: 'Remote' | 'Hybrid' | 'Onsite';
    salaryMin: number;
    salaryMax: number;
    salary: string;
    description: string;
    responsibilities: string[];
    requirements: string[];
    tags: string[];
    openings: number;
    deadline?: Date;
    featured: boolean;
    posted: string;
    postedBy?: Types.ObjectId;
    postedByModel?: 'Recruiter' | 'Admin';
    // Bot-sourced fields
    source?: 'manual' | 'remotive' | 'arbeitnow' | 'adzuna' | 'telegram';
    externalId?: string;
    externalUrl?: string;
    freeApiPostId?: string;
    isArchived?: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const JobSchema = new Schema<IJob>(
    {
        title: { type: String, required: true, trim: true },
        company: { type: String, required: true, trim: true },
        companyLogo: { type: String, default: '🏢' },
        location: { type: String, trim: true },
        city: { type: String, trim: true },
        type: {
            type: String,
            enum: ['Internship', 'Full-time', 'Part-time', 'Contract'],
            required: true,
        },
        mode: {
            type: String,
            enum: ['Remote', 'Hybrid', 'Onsite'],
            required: true,
        },
        salaryMin: { type: Number, default: 0 },
        salaryMax: { type: Number, default: 0 },
        salary: { type: String, trim: true },
        description: { type: String, required: true },
        responsibilities: [{ type: String }],
        requirements: [{ type: String }],
        tags: [{ type: String, trim: true }],
        openings: { type: Number, default: 1 },
        deadline: { type: Date },
        featured: { type: Boolean, default: false },
        posted: { type: String },
        postedBy: { type: Schema.Types.ObjectId, refPath: 'postedByModel' },
        postedByModel: { type: String, enum: ['Recruiter', 'Admin'] },
        // Bot-sourced fields
        source: {
            type: String,
            enum: ['manual', 'remotive', 'arbeitnow', 'adzuna', 'telegram'],
            default: 'manual',
        },
        externalId: { type: String, sparse: true, unique: true },
        externalUrl: { type: String },
        freeApiPostId: { type: String },
        isArchived: { type: Boolean, default: false },
    },
    { timestamps: true }
);

// Full-text search index
JobSchema.index({ title: 'text', company: 'text', tags: 'text' });
// Filter indexes
JobSchema.index({ type: 1 });
JobSchema.index({ mode: 1 });
JobSchema.index({ city: 1 });
JobSchema.index({ featured: 1 });
JobSchema.index({ createdAt: -1 });
// Bot indexes
JobSchema.index({ source: 1 });
JobSchema.index({ externalId: 1 });

export const Job = mongoose.model<IJob>('Job', JobSchema);

