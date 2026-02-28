import { z } from 'zod';
export declare const applySchema: z.ZodObject<{
    jobId: z.ZodString;
    coverLetter: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
    linkedin: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
}, z.core.$strip>;
export declare const updateStatusSchema: z.ZodObject<{
    status: z.ZodEnum<{
        Applied: "Applied";
        Shortlisted: "Shortlisted";
        Interview: "Interview";
        Rejected: "Rejected";
        Hired: "Hired";
    }>;
}, z.core.$strip>;
export declare const applyToJob: (data: z.infer<typeof applySchema>, applicantId: string) => Promise<Omit<import("mongoose").Document<unknown, {}, import("../models/Application").IApplication, {}, import("mongoose").DefaultSchemaOptions> & import("../models/Application").IApplication & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, never>>;
export declare const getMyApplications: (userId: string) => Promise<(import("mongoose").Document<unknown, {}, import("../models/Application").IApplication, {}, import("mongoose").DefaultSchemaOptions> & import("../models/Application").IApplication & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
})[]>;
export declare const getAllApplications: (jobId?: string) => Promise<(import("mongoose").Document<unknown, {}, import("../models/Application").IApplication, {}, import("mongoose").DefaultSchemaOptions> & import("../models/Application").IApplication & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
})[]>;
export declare const updateApplicationStatus: (applicationId: string, data: z.infer<typeof updateStatusSchema>) => Promise<import("mongoose").Document<unknown, {}, import("../models/Application").IApplication, {}, import("mongoose").DefaultSchemaOptions> & import("../models/Application").IApplication & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}>;
//# sourceMappingURL=application.service.d.ts.map