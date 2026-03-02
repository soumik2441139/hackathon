import mongoose from 'mongoose';
import { Job } from './src/models/Job';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.MONGODB_URI || "";

const findJob = async () => {
    try {
        console.log('Connecting to hackathon...');
        await mongoose.connect(url);
        let job = await Job.findById('69a41758eb26d64a0b851bb4');
        if (job) {
            console.log('Found Job in hackathon database!');
            console.log('Company:', job.company);
            console.log('Logo:', job.companyLogo);
        } else {
            console.log('Job not found in hackathon. Connecting to test...');
            await mongoose.disconnect();
            const testUrl = url.replace('/hackathon', '/test');
            await mongoose.connect(testUrl);
            job = await Job.findById('69a41758eb26d64a0b851bb4');
            if (job) {
                console.log('Found Job in test database!');
                console.log('Company:', job.company);
                console.log('Logo:', job.companyLogo);
            } else {
                console.log('Job NOT found in hackathon or test.');
            }
        }
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

findJob();
