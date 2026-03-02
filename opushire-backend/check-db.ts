import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.MONGODB_URI || "";
console.log('MONGODB_URI length:', url.length);
console.log('NODE_ENV:', process.env.NODE_ENV);

const check = async () => {
    try {
        if (!url) throw new Error("URI IS EMPTY");
        const conn = await mongoose.connect(url);
        console.log('Active DB Name:', conn.connection.db?.databaseName);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};
check();
