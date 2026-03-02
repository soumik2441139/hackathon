import mongoose from 'mongoose';
import { Job } from './src/models/Job';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.MONGODB_URI || "";

const checkLogo = async () => {
    try {
        console.log('Connecting to URI (obfuscated):', url.substring(0, 30) + '...');
        await mongoose.connect(url);
        console.log('✅ Connected to MongoDB');
        console.log('Host:', mongoose.connection.host);
        console.log('Database Name:', mongoose.connection.name);

        const count = await Job.countDocuments();
        console.log('Total jobs in collection:', count);

        const vercel = await Job.findOne({ company: 'Vercel' });
        console.log('--- Vercel Logo ---');
        console.log('Logo:', vercel?.companyLogo?.substring(0, 50));
        console.log('Length:', vercel?.companyLogo?.length);

        const stripe = await Job.findOne({ company: 'Stripe' });
        console.log('--- Stripe Logo ---');
        console.log('Logo:', stripe?.companyLogo?.substring(0, 50));
        console.log('Length:', stripe?.companyLogo?.length);

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

checkLogo();
