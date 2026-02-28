import mongoose, { Document, Types } from 'mongoose';
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
export declare const Application: mongoose.Model<IApplication, {}, {}, {}, mongoose.Document<unknown, {}, IApplication, {}, mongoose.DefaultSchemaOptions> & IApplication & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IApplication>;
//# sourceMappingURL=Application.d.ts.map