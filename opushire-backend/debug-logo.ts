import mongoose from 'mongoose';
import { Job } from './src/models/Job';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.MONGODB_URI || "";

const checkLogo = async () => {
    try {
        await mongoose.connect(url);
        console.log('✅ Connected to:', mongoose.connection.host, '/', mongoose.connection.name);

        const count = await Job.countDocuments();
        console.log('Total jobs:', count);

        const jobs = await Job.find({ company: 'Vercel' });
        console.log('Found', jobs.length, 'jobs for Vercel');

        for (const job of jobs) {
            console.log('--- Job ID:', job._id);
            console.log('Title:', job.title);
            console.log('Logo (100 chars):', job.companyLogo ? job.companyLogo.substring(0, 100) : 'null');
            console.log('Logo length:', job.companyLogo ? job.companyLogo.length : 0);
        }

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

checkLogo();
