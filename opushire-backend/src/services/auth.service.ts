import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { User, IUser } from '../models/User';
import { env } from '../config/env';
import { createError } from '../middleware/errorHandler';

export const registerSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    role: z.enum(['student', 'admin']).default('student'),
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

const generateToken = (user: IUser): string => {
    return jwt.sign({ id: user._id.toString(), role: user.role }, env.JWT_SECRET, {
        expiresIn: env.JWT_EXPIRES_IN as '7d',
    });
};

export const registerUser = async (data: z.infer<typeof registerSchema>) => {
    const existing = await User.findOne({ email: data.email });
    if (existing) throw createError('Email already in use', 409);

    const passwordHash = await bcrypt.hash(data.password, 12);
    const user = await User.create({ ...data, passwordHash });

    const token = generateToken(user);
    const { passwordHash: _ph, ...userObj } = user.toObject();
    return { user: userObj, token };
};

export const loginUser = async (data: z.infer<typeof loginSchema>) => {
    const user = await User.findOne({ email: data.email }).select('+passwordHash');
    if (!user) throw createError('Invalid credentials', 401);

    const isValid = await user.comparePassword(data.password);
    if (!isValid) throw createError('Invalid credentials', 401);

    const token = generateToken(user);
    const { passwordHash: _ph, ...userObj } = user.toObject();
    return { user: userObj, token };
};

export const getProfile = async (userId: string) => {
    const user = await User.findById(userId);
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
    const user = await User.findByIdAndUpdate(userId, data, { new: true, runValidators: true });
    if (!user) throw createError('User not found', 404);
    return user;
};
