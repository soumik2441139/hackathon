import mongoose from 'mongoose';
import { Job } from './src/models/Job';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.MONGODB_URI || "";

const checkLogo = async () => {
    try {
        await mongoose.connect(url);
        const job = await Job.findOne({ company: 'Vercel' });
        if (job) {
            console.log('Company:', job.company);
            console.log('Logo starts with:', job.companyLogo ? job.companyLogo.substring(0, 50) : 'null');
            console.log('Logo length:', job.companyLogo ? job.companyLogo.length : 0);
        } else {
            console.log('Job not found');
        }
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

checkLogo();
