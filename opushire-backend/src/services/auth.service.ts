import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { IUser } from '../models/User';
import { Student } from '../models/Student';
import { Admin } from '../models/Admin';
import { env } from '../config/env';
import { createError } from '../middleware/errorHandler';
import { getVerificationTtlMinutes, sendVerificationCodeEmail } from './email.service';

const models = [Student, Admin] as const;

const findUserByEmail = async (email: string, select = '') => {
    for (const model of models) {
        const query = model.findOne({ email: email.toLowerCase() });
        if (select) query.select(select);
        const user = await query;
        if (user) return user;
    }

    return null;
};

const findUserWithModelByEmail = async (email: string, select = '') => {
    for (const model of models) {
        const query = model.findOne({ email: email.toLowerCase() });
        if (select) query.select(select);
        const user = await query;
        if (user) return { user, model };
    }

    return { user: null, model: null };
};

const findUserById = async (id: string) => {
    let user = await Student.findById(id).populate('savedJobs');
    if (user) return user;
    user = await Admin.findById(id).populate('savedJobs');
    return user;
};

export const registerSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    // Public signup is student-only. Admin provisioning must be internal.
    role: z.literal('student').optional().default('student'),
    college: z.string().optional(),
    degree: z.string().optional(),
    year: z.string().optional(),
    skills: z.array(z.string()).optional().default([]),
    bio: z.string().optional(),
});

export const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1, 'Password is required'),
});

export const verifyEmailSchema = z.object({
    email: z.string().email(),
    code: z.string().trim().regex(/^\d{6}$/, 'Verification code must be 6 digits'),
});

export const resendVerificationSchema = z.object({
    email: z.string().email(),
});

const generateToken = (user: IUser): string => {
    return jwt.sign({ id: user._id.toString(), role: user.role }, env.JWT_SECRET, {
        expiresIn: env.JWT_EXPIRES_IN as '7d',
    });
};

const sanitizeUser = (user: IUser) => {
    const plain = user.toObject() as Record<string, unknown>;
    delete plain.passwordHash;
    delete plain.refreshToken;
    delete plain.resetToken;
    delete plain.resetTokenExpiry;
    delete plain.emailVerificationCode;
    delete plain.emailVerificationExpiry;
    return plain;
};

const createVerificationCode = () => {
    const code = crypto.randomInt(100000, 1000000).toString();
    const codeHash = crypto.createHash('sha256').update(code).digest('hex');
    const expiresAt = new Date(Date.now() + getVerificationTtlMinutes() * 60 * 1000);

    return { code, codeHash, expiresAt };
};

export const registerUser = async (data: z.infer<typeof registerSchema>) => {
    const email = data.email.toLowerCase();
    const existing = await findUserByEmail(email);
    if (existing) throw createError('Email already in use', 409);

    const passwordHash = await bcrypt.hash(data.password, 12);
    const { password: _password, ...userData } = data;
    const { code, codeHash, expiresAt } = createVerificationCode();

    const user = await Student.create({
        ...userData,
        email,
        passwordHash,
        emailVerified: false,
        emailVerificationCode: codeHash,
        emailVerificationExpiry: expiresAt,
    });

    try {
        await sendVerificationCodeEmail({
            email: user.email,
            name: user.name,
            code,
        });
    } catch (error) {
        await user.deleteOne();
        throw error;
    }

    return {
        email: user.email,
        verificationRequired: true,
        expiresInMinutes: getVerificationTtlMinutes(),
        message: 'Verification code sent to your email address.',
    };
};

export const loginUser = async (data: z.infer<typeof loginSchema>) => {
    const user = await findUserByEmail(data.email, '+passwordHash');
    if (!user) throw createError('Invalid credentials', 401);

    if (user.emailVerified === false) {
        throw createError('Email not verified. Enter the code sent to your inbox before logging in.', 403);
    }

    const isValid = await user.comparePassword(data.password);
    if (!isValid) throw createError('Invalid credentials', 401);

    const token = generateToken(user);
    return { user: sanitizeUser(user), token };
};

export const verifyEmail = async (data: z.infer<typeof verifyEmailSchema>) => {
    const { user } = await findUserWithModelByEmail(
        data.email,
        '+emailVerificationCode +emailVerificationExpiry'
    );

    if (!user) throw createError('Invalid or expired verification request.', 400);
    if (user.emailVerified !== false) throw createError('Email is already verified. Please log in.', 400);
    if (!user.emailVerificationCode || !user.emailVerificationExpiry) {
        throw createError('Verification code is missing. Request a new code.', 400);
    }
    if (user.emailVerificationExpiry.getTime() < Date.now()) {
        throw createError('Verification code has expired. Request a new code.', 400);
    }

    const submittedHash = crypto.createHash('sha256').update(data.code).digest('hex');
    if (submittedHash !== user.emailVerificationCode) {
        throw createError('Invalid verification code.', 400);
    }

    user.emailVerified = true;
    user.emailVerificationCode = undefined;
    user.emailVerificationExpiry = undefined;
    await user.save();

    const token = generateToken(user);
    return { user: sanitizeUser(user), token };
};

export const resendVerificationCode = async (data: z.infer<typeof resendVerificationSchema>) => {
    const { user } = await findUserWithModelByEmail(
        data.email,
        '+emailVerificationCode +emailVerificationExpiry'
    );

    if (!user) throw createError('No pending verification was found for this email.', 404);
    if (user.emailVerified !== false) throw createError('Email is already verified. Please log in.', 400);

    const previousCode = user.emailVerificationCode;
    const previousExpiry = user.emailVerificationExpiry;
    const { code, codeHash, expiresAt } = createVerificationCode();

    user.emailVerificationCode = codeHash;
    user.emailVerificationExpiry = expiresAt;
    await user.save();

    try {
        await sendVerificationCodeEmail({
            email: user.email,
            name: user.name,
            code,
        });
    } catch (error) {
        user.emailVerificationCode = previousCode;
        user.emailVerificationExpiry = previousExpiry;
        await user.save();
        throw error;
    }

    return {
        email: user.email,
        verificationRequired: true,
        expiresInMinutes: getVerificationTtlMinutes(),
        message: 'A new verification code has been sent.',
    };
};

export const getProfile = async (userId: string) => {
    const user = await findUserById(userId);
    if (!user) throw createError('User not found', 404);
    return user;
};

// Allowlist of safe-to-update fields — prevents overwriting passwordHash, role, _id, etc.
const updateProfileSchema = z.object({
    name: z.string().min(2).optional(),
    college: z.string().optional(),
    degree: z.string().optional(),
    year: z.string().optional(),
    skills: z.array(z.string()).optional(),
    bio: z.string().optional(),
});

export const updateProfile = async (userId: string, rawData: unknown) => {
    const data = updateProfileSchema.parse(rawData);

    // Attempt update in all collections
    let user = await Student.findByIdAndUpdate(userId, data, { returnDocument: 'after', runValidators: true });
    if (!user) user = await Admin.findByIdAndUpdate(userId, data, { returnDocument: 'after', runValidators: true });

    if (!user) throw createError('User not found', 404);
    return user;
};
