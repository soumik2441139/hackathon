import mongoose from 'mongoose';
import { Job } from './src/models/Job';
import { imageToBase64 } from './src/services/image.service';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.MONGODB_URI || "";

const run = async () => {
    try {
        await mongoose.connect(url);
        console.log('✅ Connected to:', mongoose.connection.host, '/', mongoose.connection.name);

        const logoUrl = 'https://unavatar.io/vercel.com';
        console.log('⏳ Converting logo...');
        const base64 = await imageToBase64(logoUrl);
        console.log('   Converted. Prefix:', base64.substring(0, 50));

        console.log('🗑️ Clearing jobs...');
        await Job.deleteMany({});

        console.log('📝 Inserting test job...');
        await Job.create({
            title: "Test Job",
            company: "Vercel",
            companyLogo: base64,
            type: "Full-time",
            mode: "Remote",
            description: "Test",
            postedBy: new mongoose.Types.ObjectId()
        });

        console.log('🔍 Reading job back...');
        const job = await Job.findOne({ company: 'Vercel' });
        if (job) {
            console.log('Logo in DB starts with:', job.companyLogo.substring(0, 50));
            console.log('Logo length in DB:', job.companyLogo.length);
        } else {
            console.log('❌ Job not found after insert!');
        }

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

run();
