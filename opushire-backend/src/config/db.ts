import mongoose from 'mongoose';
import { env } from './env';

let isConnected = false;
let connectPromise: Promise<void> | null = null;

const runPostConnectTasks = async (conn: Awaited<ReturnType<typeof mongoose.connect>>) => {
    console.log(`✅ MongoDB connected: ${conn.connection.host} / ${conn.connection.name}`);

    // Auto-migration check: If students/recruiters are empty but users exist, split them
    const db = conn.connection.db;
    if (db) {
        const studentCount = await db.collection('students').countDocuments();
        const recruiterCount = await db.collection('recruiters').countDocuments();

        if (studentCount === 0 && recruiterCount === 0) {
            console.log('🔍 [Auto-Migration] Checking for users to reorganize...');
            const usersCol = db.collection('users');
            const users = await usersCol.find({}).toArray();

            if (users.length > 0) {
                console.log(`🚀 [Auto-Migration] Detected ${users.length} users to reorganize into split collections...`);
                for (const user of users) {
                    const target = user.role === 'recruiter' ? 'recruiters' :
                        user.role === 'admin' ? 'admins' : 'students';
                    await db.collection(target).updateOne({ _id: user._id }, { $set: user }, { upsert: true });
                }
                console.log('✅ [Auto-Migration] Data successfully reorganized.');
            } else {
                console.log('ℹ️ [Auto-Migration] No local users found for reorganization.');
            }
        }
    }

    isConnected = true;
};

const connectOnce = async (): Promise<void> => {
    if (isConnected && mongoose.connection.readyState === 1) {
        return;
    }

    if (connectPromise) {
        return connectPromise;
    }

    connectPromise = (async () => {
        const conn = await mongoose.connect(env.MONGODB_URI, {
            serverSelectionTimeoutMS: 15000,
            socketTimeoutMS: 45000,
        });
        await runPostConnectTasks(conn);
    })().finally(() => {
        connectPromise = null;
    });

    return connectPromise;
};

const connectWithRetry = async (): Promise<void> => {
    try {
        await connectOnce();
    } catch (error: any) {
        const maskedUri = env.MONGODB_URI.replace(/\/\/.*@/, '//***:***@');
        console.error('❌ MongoDB connection failed:', error?.message || error);
        console.error('📍 URI attempted:', maskedUri);
        console.log('🔄 Retrying MongoDB connection in 5 seconds...');
        setTimeout(connectWithRetry, 5000);
    }
};

export const connectDB = async (): Promise<void> => {
    if (isConnected) return;
    // Connect in background — don't block server startup
    connectWithRetry();
};

export const connectDBBlocking = async (): Promise<void> => {
    await connectOnce();
};

export const disconnectDB = async (): Promise<void> => {
    connectPromise = null;
    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
    }
    isConnected = false;
};

mongoose.connection.on('disconnected', () => {
    console.warn('⚠️  MongoDB disconnected');
    isConnected = false;
});
