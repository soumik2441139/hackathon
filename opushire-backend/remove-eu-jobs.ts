import mongoose from 'mongoose';
import { Job } from './src/models/Job';
import { env } from './src/config/env';

const BLOCKED_LOCATIONS = [
    'germany', 'switzerland', 'berlin', 'munich', 'frankfurt', 'zurich', 'geneva', 'basel', 'hamburg', 'cologne', 'stuttgart', 'dusseldorf', 'bern', 'lausanne'
];

async function removeEuJobs() {
    try {
        await mongoose.connect(env.MONGODB_URI);
        console.log("Connected to DB");

        const regex = new RegExp(`\\b(${BLOCKED_LOCATIONS.join('|')})\\b`, 'i');

        const result = await Job.deleteMany({
            $or: [
                { location: regex },
                { city: regex },
                { title: regex }
            ]
        });

        console.log(`Successfully deleted ${result.deletedCount} jobs from Germany/Switzerland.`);
    } catch (e) {
        console.error("Cleanup failed:", e);
    } finally {
        await mongoose.disconnect();
    }
}

removeEuJobs();
