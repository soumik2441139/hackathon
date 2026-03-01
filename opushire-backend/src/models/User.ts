import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
    name: string;
    email: string;
    passwordHash: string;
    role: 'student' | 'admin' | 'recruiter';
    college?: string;
    degree?: string;
    year?: string;
    skills: string[];
    bio?: string;
    companyName?: string;
    companyWebsite?: string;
    avatar: string;
    createdAt: Date;
    updatedAt: Date;
    comparePassword(password: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
    {
        name: { type: String, required: true, trim: true },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        passwordHash: { type: String, required: true, select: false },
        role: { type: String, enum: ['student', 'admin', 'recruiter'], default: 'student' },
        college: { type: String, trim: true },
        degree: { type: String, trim: true },
        year: { type: String, trim: true },
        skills: [{ type: String, trim: true }],
        bio: { type: String, trim: true },
        companyName: { type: String, trim: true },
        companyWebsite: { type: String, trim: true },
        avatar: { type: String },
    },
    { timestamps: true }
);

// Auto-generate avatar from first letter of name
UserSchema.pre('save', async function () {
    if (this.isModified('name') || !this.avatar) {
        this.avatar = this.name.charAt(0).toUpperCase();
    }
});

// Compare password helper
UserSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
    return bcrypt.compare(password, this.passwordHash);
};

// Indexes
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ role: 1 });
UserSchema.index({ createdAt: -1 });

export const User = mongoose.model<IUser>('User', UserSchema);
