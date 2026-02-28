import mongoose from 'mongoose';
import { env } from './env';

let isConnected = false;

const connectWithRetry = async (): Promise<void> => {
    try {
        const conn = await mongoose.connect(env.MONGODB_URI, {
            serverSelectionTimeoutMS: 15000,
            socketTimeoutMS: 45000,
        });
        isConnected = true;
        console.log(`✅ MongoDB connected: ${conn.connection.host}`);
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
