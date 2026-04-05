import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
    name: string;
    email: string;
    passwordHash: string;
    role: 'student' | 'admin';
    college?: string;
    degree?: string;
    year?: string;
    skills: string[];
    bio?: string;
    avatar: string;
    phone?: string;
    linkedin?: string;
    savedJobs: mongoose.Types.ObjectId[];
    emailedJobs: mongoose.Types.ObjectId[];
    createdAt: Date;
    updatedAt: Date;
    refreshToken?: string;
    resetToken?: string;
    resetTokenExpiry?: Date;
    // Email verification — undefined/true = verified (existing users unaffected)
    emailVerified?: boolean;
    emailVerificationCode?: string;
    emailVerificationExpiry?: Date;
    telegramChatId?: string;       // For Antigravity autonomous outreach
    outreachEnabled?: boolean;     // Toggle for job notifications
    
    // Resume Metadata
    extraData?: any;

    comparePassword(password: string): Promise<boolean>;
}



export const UserSchema = new Schema<IUser>(
    {
        name: { type: String, required: true, trim: true },
        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
        },
        passwordHash: { type: String, required: true, select: false },
        role: { type: String, enum: ['student', 'admin'], default: 'student' },
        college: { type: String, trim: true },
        degree: { type: String, trim: true },
        year: { type: String, trim: true },
        skills: [{ type: String, trim: true }],
        bio: { type: String, trim: true },
        avatar: { type: String },
        savedJobs: [{ type: Schema.Types.ObjectId, ref: 'Job' }],
        emailedJobs: [{ type: Schema.Types.ObjectId, ref: 'Job' }],
        refreshToken: { type: String, select: false },
        resetToken: { type: String },
        resetTokenExpiry: { type: Date },
        // Email verification (select: false keeps it out of normal queries)
        emailVerified: { type: Boolean, default: true },
        emailVerificationCode: { type: String, select: false },
        emailVerificationExpiry: { type: Date, select: false },
        telegramChatId: { type: String, sparse: true },
        outreachEnabled: { type: Boolean, default: true }
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
