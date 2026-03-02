import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.MONGODB_URI || "";

const listDBs = async () => {
    try {
        console.log('Connecting to URI (obfuscated):', url.substring(0, 30) + '...');
        const conn = await mongoose.connect(url);
        console.log('✅ Connected');

        const admin = conn.connection.db?.admin();
        if (admin) {
            const dbs = await admin.listDatabases();
            console.log('Databases available:');
            dbs.databases.forEach((db: any) => console.log(`- ${db.name}`));
        } else {
            console.log('Could not get admin handle');
        }

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

listDBs();
