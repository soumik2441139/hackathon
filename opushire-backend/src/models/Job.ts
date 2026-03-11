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
    skills?: string[]; // New: Added for AI matching
    level?: string;  // New: Added for AI matching (e.g. intern, junior)
    domains?: string[]; // New: Added for AI matching (e.g. Web, ML, Cloud)
    openings: number;
    deadline?: Date;
    featured: boolean;
    posted: string;
    postedBy?: Types.ObjectId;
    // Bot-sourced fields
    source?: 'manual' | 'remotive' | 'arbeitnow' | 'adzuna' | 'telegram';
    externalId?: string;
    externalUrl?: string;
    freeApiPostId?: string;
    tagTileStatus?: 'OK' | 'NEEDS_SHORTENING' | 'READY_TO_APPLY' | 'VETTED';
    verifiedTags?: string[];
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
        skills: [{ type: String, trim: true }],
        level: { type: String, trim: true },
        domains: [{ type: String, trim: true }],
        openings: { type: Number, default: 1 },
        deadline: { type: Date },
        featured: { type: Boolean, default: false },
        posted: { type: String },
        postedBy: { type: Schema.Types.ObjectId }, // Removed refPath as postedByModel is removed
        // Bot-sourced fields
        source: {
            type: String,
            enum: ['manual', 'remotive', 'arbeitnow', 'adzuna', 'telegram'],
            default: 'manual',
        },
        externalId: { type: String, sparse: true, unique: true },
        externalUrl: { type: String },
        freeApiPostId: { type: String },
        tagTileStatus: {
            type: String,
            enum: ['OK', 'NEEDS_SHORTENING', 'READY_TO_APPLY', 'VETTED'],
            default: 'OK',
        },
        verifiedTags: [{ type: String, trim: true }],
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

const JobModel = mongoose.model<IJob>('Job', JobSchema);
export { JobModel as Job };
export default JobModel;
