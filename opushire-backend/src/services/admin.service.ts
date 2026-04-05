import mongoose from 'mongoose';
import { Student } from '../models/Student';
import { Admin } from '../models/Admin';
import { Job } from '../models/Job';
import { Application } from '../models/Application';
import { createError } from '../middleware/errorHandler';

export const getAllUsers = async (role?: string) => {
    if (role === 'student') return Student.find().sort({ createdAt: -1 });
    if (role === 'admin') return Admin.find().sort({ createdAt: -1 });

    // If no role, aggregate all (simple approach)
    const [students, admins] = await Promise.all([
        Student.find(),
        Admin.find()
    ]);
    return [...students, ...admins].sort((a: any, b: any) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
};

export const deleteUser = async (userId: string) => {
    // Attempt deletion from all collections
    let user = await Student.findByIdAndDelete(userId);
    if (!user) user = await Admin.findByIdAndDelete(userId);

    if (!user) throw createError('User not found', 404);

    // Cleanup: Delete jobs posted by Admin
    if (user.role === 'admin') {
        await Job.deleteMany({ postedBy: userId });
    }

    // Cleanup: Delete applications by student
    if (user.role === 'student') {
        await Application.deleteMany({ applicant: userId });
    }

    return { message: 'User and associated data deleted successfully' };
};

export const getSystemStats = async () => {
    const [totalJobs, totalApplicants, totalStudents] = await Promise.all([
        Job.countDocuments(),
        Application.countDocuments(),
        Student.countDocuments()
    ]);

    return {
        totalJobs,
        totalApplicants,
        totalStudents,
        activeUsers: totalStudents
    };
};

import { probeRedis } from './queue/queue.service';

export const getDeepHealth = async () => {
    const isMongoConnected = mongoose.connection.readyState === 1;
    const redisProbe = await probeRedis();

    const alerts = [];
    if (!isMongoConnected) alerts.push({ type: 'critical', message: 'MongoDB is disconnected or unreachable.' });
    if (!redisProbe.primary) alerts.push({ type: 'critical', message: 'Primary Redis Queue (BullMQ) is down. Background jobs will not process.' });
    if (process.env.REDIS_SECONDARY_HOST && !redisProbe.secondary) alerts.push({ type: 'warning', message: 'Secondary Redis (Heavy Queue) is offline.' });

    return {
        timestamp: new Date().toISOString(),
        mongodb: isMongoConnected ? 'healthy' : 'down',
        redisPrimary: redisProbe.primary ? 'healthy' : 'down',
        redisSecondary: redisProbe.secondary ? 'healthy' : 'down',
        status: alerts.length === 0 ? 'operational' : 'outage',
        alerts
    };
};

export const getPendingJobs = async () => {
    return Job.find({ tagTileStatus: 'READY_TO_APPLY' })
        .select('title company tags verifiedTags _id')
        .lean();
};

export const resolvePendingJob = async (jobId: string, action: 'approve' | 'reject') => {
    const job = await Job.findById(jobId);
    if (!job) throw createError('Job not found', 404);

    if (job.tagTileStatus !== 'READY_TO_APPLY') {
        throw createError(`Job is not pending review. Status: ${job.tagTileStatus}`, 400);
    }

    if (action === 'approve') {
        await Job.updateOne(
            { _id: jobId },
            {
                $set: { tags: job.verifiedTags, tagTileStatus: 'VETTED' },
                $unset: { verifiedTags: "" }
            }
        );
        return { message: 'AI Fix Applied Successfully' };
    } else {
        await Job.updateOne(
            { _id: jobId },
            {
                $set: { tagTileStatus: 'NEEDS_SHORTENING' },
                $unset: { verifiedTags: "" }
            }
        );
        return { message: 'AI Fix Rejected. Sent back to queue.' };
    }
};

export const debugDatabase = async (forceMigrate: boolean = false) => {
    try {
        const conn = mongoose.connection;
        const db = conn.db;

        if (!db) return { error: 'No database connection' };

        const results: any = {
            currentDb: db.databaseName,
            collections: []
        };

        if (forceMigrate) {
            console.log('🚀 [Manual-Migration] Forced reorganization triggered via API.');

            // Check local users collection
            const localUsers = await db.collection('users').find({}).toArray();
            if (localUsers.length > 0) {
                console.log(`🚀 [Manual-Migration] Found ${localUsers.length} users to split...`);
                for (const user of localUsers) {
                    const target = user.role === 'admin' ? 'admins' : 'students';
                    await db.collection(target).updateOne({ _id: user._id }, { $set: user }, { upsert: true });
                }
                results.reorgStatus = `Successfully reorganized ${localUsers.length} local users into split collections.`;
            } else {
                results.reorgStatus = 'No data found in local "users" collection for reorganization.';
            }
        }

        const collections = await db.listCollections().toArray();
        for (const col of collections) {
            const count = await db.collection(col.name).countDocuments();
            results.collections.push({ name: col.name, count });
        }

        return results;
    } catch (err: any) {
        console.error('❌ [Debug-DB] Error:', err);
        throw err; // Re-throw so controller catch it and returns 500
    }
};
