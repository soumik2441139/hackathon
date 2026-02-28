import mongoose, { Document, Schema, Types } from 'mongoose';

export type ApplicationStatus = 'Applied' | 'Shortlisted' | 'Interview' | 'Rejected' | 'Hired';

export interface IApplication extends Document {
    job: Types.ObjectId;
    applicant: Types.ObjectId;
    status: ApplicationStatus;
    coverLetter?: string;
    phone?: string;
    linkedin?: string;
    appliedAt: Date;
    updatedAt: Date;
}

const ApplicationSchema = new Schema<IApplication>(
    {
        job: { type: Schema.Types.ObjectId, ref: 'Job', required: true },
        applicant: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        status: {
            type: String,
            enum: ['Applied', 'Shortlisted', 'Interview', 'Rejected', 'Hired'],
            default: 'Applied',
        },
        coverLetter: { type: String },
        phone: { type: String, trim: true },
        linkedin: { type: String, trim: true },
        appliedAt: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

// Compound unique: one application per user per job
ApplicationSchema.index({ job: 1, applicant: 1 }, { unique: true });
ApplicationSchema.index({ status: 1 });
ApplicationSchema.index({ appliedAt: -1 });

export const Application = mongoose.model<IApplication>('Application', ApplicationSchema);
