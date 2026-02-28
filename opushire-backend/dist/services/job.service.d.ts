import { z } from 'zod';
export declare const createJobSchema: z.ZodObject<{
    title: z.ZodString;
    company: z.ZodString;
    companyLogo: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    location: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    city: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    type: z.ZodEnum<{
        Internship: "Internship";
        "Full-time": "Full-time";
        "Part-time": "Part-time";
        Contract: "Contract";
    }>;
    mode: z.ZodEnum<{
        Remote: "Remote";
        Hybrid: "Hybrid";
        Onsite: "Onsite";
    }>;
    salaryMin: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    salaryMax: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    salary: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    description: z.ZodString;
    responsibilities: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodString>>>;
    requirements: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodString>>>;
    tags: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodString>>>;
    openings: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    deadline: z.ZodOptional<z.ZodString>;
    featured: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, z.core.$strip>;
export declare const updateJobSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    company: z.ZodOptional<z.ZodString>;
    companyLogo: z.ZodOptional<z.ZodDefault<z.ZodOptional<z.ZodString>>>;
    location: z.ZodOptional<z.ZodDefault<z.ZodOptional<z.ZodString>>>;
    city: z.ZodOptional<z.ZodDefault<z.ZodOptional<z.ZodString>>>;
    type: z.ZodOptional<z.ZodEnum<{
        Internship: "Internship";
        "Full-time": "Full-time";
        "Part-time": "Part-time";
        Contract: "Contract";
    }>>;
    mode: z.ZodOptional<z.ZodEnum<{
        Remote: "Remote";
        Hybrid: "Hybrid";
        Onsite: "Onsite";
    }>>;
    salaryMin: z.ZodOptional<z.ZodDefault<z.ZodOptional<z.ZodNumber>>>;
    salaryMax: z.ZodOptional<z.ZodDefault<z.ZodOptional<z.ZodNumber>>>;
    salary: z.ZodOptional<z.ZodDefault<z.ZodOptional<z.ZodString>>>;
    description: z.ZodOptional<z.ZodString>;
    responsibilities: z.ZodOptional<z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodString>>>>;
    requirements: z.ZodOptional<z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodString>>>>;
    tags: z.ZodOptional<z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodString>>>>;
    openings: z.ZodOptional<z.ZodDefault<z.ZodOptional<z.ZodNumber>>>;
    deadline: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    featured: z.ZodOptional<z.ZodDefault<z.ZodOptional<z.ZodBoolean>>>;
}, z.core.$strip>;
export declare const jobFilterSchema: z.ZodObject<{
    q: z.ZodOptional<z.ZodString>;
    type: z.ZodOptional<z.ZodString>;
    mode: z.ZodOptional<z.ZodString>;
    city: z.ZodOptional<z.ZodString>;
    featured: z.ZodOptional<z.ZodString>;
    page: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    limit: z.ZodDefault<z.ZodOptional<z.ZodString>>;
}, z.core.$strip>;
export declare const getJobs: (filters: z.infer<typeof jobFilterSchema>) => Promise<{
    jobs: (import("mongoose").Document<unknown, {}, import("../models/Job").IJob, {}, import("mongoose").DefaultSchemaOptions> & import("../models/Job").IJob & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    })[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        pages: number;
    };
}>;
export declare const getJobById: (id: string) => Promise<import("mongoose").Document<unknown, {}, import("../models/Job").IJob, {}, import("mongoose").DefaultSchemaOptions> & import("../models/Job").IJob & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}>;
export declare const createJob: (data: z.infer<typeof createJobSchema>, adminId: string) => Promise<import("mongoose").Document<unknown, {}, import("../models/Job").IJob, {}, import("mongoose").DefaultSchemaOptions> & import("../models/Job").IJob & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}>;
export declare const updateJob: (id: string, rawData: unknown) => Promise<import("mongoose").Document<unknown, {}, import("../models/Job").IJob, {}, import("mongoose").DefaultSchemaOptions> & import("../models/Job").IJob & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}>;
export declare const deleteJob: (id: string) => Promise<{
    message: string;
}>;
//# sourceMappingURL=job.service.d.ts.map