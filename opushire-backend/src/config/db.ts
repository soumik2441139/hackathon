import mongoose from 'mongoose';
import { env } from './env';

let isConnected = false;

const connectWithRetry = async (): Promise<void> => {
    try {
        const conn = await mongoose.connect(env.MONGODB_URI, {
            serverSelectionTimeoutMS: 15000,
            socketTimeoutMS: 45000,
        });
        console.log(`✅ MongoDB connected: ${conn.connection.host} / ${conn.connection.name}`);

        // Auto-migration check: If students/recruiters are empty but users exist, split them
        const db = conn.connection.db;
        if (db) {
            const studentCount = await db.collection('students').countDocuments();
            const recruiterCount = await db.collection('recruiters').countDocuments();

            if (studentCount === 0 && recruiterCount === 0) {
                console.log('🔍 [Auto-Migration] Checking for data to reorganize...');

                // 1. Try current DB
                let usersCol = db.collection('users');
                let users = await usersCol.find({}).toArray();

                // 2. If current DB is empty, try 'hackathon' DB on same cluster
                if (users.length === 0) {
                    const client = conn.connection.getClient();
                    const hackathonDb = client.db('hackathon');
                    const hackathonUsers = await hackathonDb.collection('users').find({}).toArray();

                    if (hackathonUsers.length > 0) {
                        console.log(`🚀 [Auto-Migration] Found data in 'hackathon' database. Pulling into '${db.databaseName}'...`);
                        users = hackathonUsers;

                        // Also pull jobs and applications if they are missing in current DB
                        for (const colName of ['jobs', 'applications']) {
                            const currentCount = await db.collection(colName).countDocuments();
                            if (currentCount === 0) {
                                const docs = await hackathonDb.collection(colName).find({}).toArray();
                                if (docs.length > 0) {
                                    console.log(`   📦 Migrating ${docs.length} from ${colName}...`);
                                    for (const doc of docs) {
                                        await db.collection(colName).updateOne({ _id: doc._id }, { $set: doc }, { upsert: true });
                                    }
                                }
                            }
                        }
                    }
                }

                if (users.length > 0) {
                    console.log(`🚀 [Auto-Migration] Detected ${users.length} users to split into collections...`);
                    for (const user of users) {
                        const target = user.role === 'recruiter' ? 'recruiters' :
                            user.role === 'admin' ? 'admins' : 'students';
                        await db.collection(target).updateOne({ _id: user._id }, { $set: user }, { upsert: true });
                    }
                    console.log('✅ [Auto-Migration] Data successfully reorganized.');
                } else {
                    console.log('ℹ️ [Auto-Migration] No data found for reorganization.');
                }
            }
        }

        isConnected = true;
    } catch (error: any) {
        console.error('❌ MongoDB connection failed:', error?.message || error);
        console.log('🔄 Retrying MongoDB connection in 5 seconds...');
        setTimeout(connectWithRetry, 5000);
    }
};

export const connectDB = async (): Promise<void> => {
    if (isConnected) return;
    // Connect in background — don't block server startup
    connectWithRetry();
};

mongoose.connection.on('disconnected', () => {
    console.warn('⚠️  MongoDB disconnected');
    isConnected = false;
});
