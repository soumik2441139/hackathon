import mongoose, { Document, Types } from 'mongoose';
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
    postedBy: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Job: mongoose.Model<IJob, {}, {}, {}, mongoose.Document<unknown, {}, IJob, {}, mongoose.DefaultSchemaOptions> & IJob & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IJob>;
//# sourceMappingURL=Job.d.ts.map