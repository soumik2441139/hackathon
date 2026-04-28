import mongoose, { Document, Schema } from 'mongoose';

// This schema MUST stay in sync with the main OpusHire backend Job model.
// Bot-sourced jobs skip postedBy/postedByModel and use source/externalId instead.

export interface IBotJob extends Document {
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
    source: 'manual' | 'remotive' | 'arbeitnow' | 'adzuna' | 'telegram' | 'himalayas' | 'jsearch' | 'linkedin' | 'activejobsdb';
    externalId: string;
    externalUrl: string;
    createdAt: Date;
    updatedAt: Date;
}

const BotJobSchema = new Schema<IBotJob>(
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
        source: {
            type: String,
            enum: ['manual', 'remotive', 'arbeitnow', 'adzuna', 'telegram', 'himalayas', 'jsearch', 'linkedin', 'activejobsdb'],
            required: true,
        },
        externalId: { type: String, required: true, unique: true },
        externalUrl: { type: String },
    },
    { timestamps: true }
);

BotJobSchema.index({ externalId: 1 }, { unique: true });
BotJobSchema.index({ source: 1 });
BotJobSchema.index({ createdAt: -1 });
BotJobSchema.index({ title: 'text', company: 'text', tags: 'text' });

export const BotJob = mongoose.model<IBotJob>('Job', BotJobSchema, 'jobs');
