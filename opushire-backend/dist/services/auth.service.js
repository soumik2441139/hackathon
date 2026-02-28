"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfile = exports.getProfile = exports.loginUser = exports.registerUser = exports.loginSchema = exports.registerSchema = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const zod_1 = require("zod");
const User_1 = require("../models/User");
const env_1 = require("../config/env");
const errorHandler_1 = require("../middleware/errorHandler");
exports.registerSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Name must be at least 2 characters'),
    email: zod_1.z.string().email('Invalid email'),
    password: zod_1.z.string().min(6, 'Password must be at least 6 characters'),
    role: zod_1.z.enum(['student', 'admin']).default('student'),
    college: zod_1.z.string().optional(),
    degree: zod_1.z.string().optional(),
    year: zod_1.z.string().optional(),
    skills: zod_1.z.array(zod_1.z.string()).optional().default([]),
    bio: zod_1.z.string().optional(),
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(1, 'Password is required'),
});
const generateToken = (user) => {
    return jsonwebtoken_1.default.sign({ id: user._id.toString(), role: user.role }, env_1.env.JWT_SECRET, {
        expiresIn: env_1.env.JWT_EXPIRES_IN,
    });
};
const registerUser = async (data) => {
    const existing = await User_1.User.findOne({ email: data.email });
    if (existing)
        throw (0, errorHandler_1.createError)('Email already in use', 409);
    const passwordHash = await bcryptjs_1.default.hash(data.password, 12);
    const user = await User_1.User.create({ ...data, passwordHash });
    const token = generateToken(user);
    const { passwordHash: _ph, ...userObj } = user.toObject();
    return { user: userObj, token };
};
exports.registerUser = registerUser;
const loginUser = async (data) => {
    const user = await User_1.User.findOne({ email: data.email }).select('+passwordHash');
    if (!user)
        throw (0, errorHandler_1.createError)('Invalid credentials', 401);
    const isValid = await user.comparePassword(data.password);
    if (!isValid)
        throw (0, errorHandler_1.createError)('Invalid credentials', 401);
    const token = generateToken(user);
    const { passwordHash: _ph, ...userObj } = user.toObject();
    return { user: userObj, token };
};
exports.loginUser = loginUser;
const getProfile = async (userId) => {
    const user = await User_1.User.findById(userId);
    if (!user)
        throw (0, errorHandler_1.createError)('User not found', 404);
    return user;
};
exports.getProfile = getProfile;
// Allowlist of safe-to-update fields — prevents overwriting passwordHash, role, _id, etc.
const updateProfileSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).optional(),
    college: zod_1.z.string().optional(),
    degree: zod_1.z.string().optional(),
    year: zod_1.z.string().optional(),
    skills: zod_1.z.array(zod_1.z.string()).optional(),
    bio: zod_1.z.string().optional(),
});
const updateProfile = async (userId, rawData) => {
    const data = updateProfileSchema.parse(rawData);
    const user = await User_1.User.findByIdAndUpdate(userId, data, { new: true, runValidators: true });
    if (!user)
        throw (0, errorHandler_1.createError)('User not found', 404);
    return user;
};
exports.updateProfile = updateProfile;
//# sourceMappingURL=auth.service.js.map