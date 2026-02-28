import { z } from 'zod';
import { IUser } from '../models/User';
export declare const registerSchema: z.ZodObject<{
    name: z.ZodString;
    email: z.ZodString;
    password: z.ZodString;
    role: z.ZodDefault<z.ZodEnum<{
        student: "student";
        admin: "admin";
    }>>;
    college: z.ZodOptional<z.ZodString>;
    degree: z.ZodOptional<z.ZodString>;
    year: z.ZodOptional<z.ZodString>;
    skills: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodString>>>;
    bio: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const loginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, z.core.$strip>;
export declare const registerUser: (data: z.infer<typeof registerSchema>) => Promise<{
    user: {
        name: string;
        email: string;
        role: "student" | "admin";
        college?: string;
        degree?: string;
        year?: string;
        skills: string[];
        bio?: string;
        avatar: string;
        createdAt: Date;
        updatedAt: Date;
        comparePassword(password: string): Promise<boolean>;
        _id: import("mongoose").Types.ObjectId;
        $locals: Record<string, unknown>;
        $op: "save" | "validate" | "remove" | null;
        $where: Record<string, unknown>;
        baseModelName?: string;
        collection: import("mongoose").Collection;
        db: import("mongoose").Connection;
        errors?: import("mongoose").Error.ValidationError;
        isNew: boolean;
        schema: import("mongoose").Schema;
        __v: number;
    };
    token: string;
}>;
export declare const loginUser: (data: z.infer<typeof loginSchema>) => Promise<{
    user: {
        name: string;
        email: string;
        role: "student" | "admin";
        college?: string;
        degree?: string;
        year?: string;
        skills: string[];
        bio?: string;
        avatar: string;
        createdAt: Date;
        updatedAt: Date;
        comparePassword(password: string): Promise<boolean>;
        _id: import("mongoose").Types.ObjectId;
        $locals: Record<string, unknown>;
        $op: "save" | "validate" | "remove" | null;
        $where: Record<string, unknown>;
        baseModelName?: string;
        collection: import("mongoose").Collection;
        db: import("mongoose").Connection;
        errors?: import("mongoose").Error.ValidationError;
        isNew: boolean;
        schema: import("mongoose").Schema;
        __v: number;
    };
    token: string;
}>;
export declare const getProfile: (userId: string) => Promise<import("mongoose").Document<unknown, {}, IUser, {}, import("mongoose").DefaultSchemaOptions> & IUser & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}>;
export declare const updateProfile: (userId: string, rawData: unknown) => Promise<import("mongoose").Document<unknown, {}, IUser, {}, import("mongoose").DefaultSchemaOptions> & IUser & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}>;
//# sourceMappingURL=auth.service.d.ts.map