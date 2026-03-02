import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

async function checkData() {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/test';
    console.log('Connecting to:', uri);

    try {
        const conn = await mongoose.connect(uri);
        const db = conn.connection.db;
        if (!db) throw new Error('Could not connect to database');

        const collections = await db.listCollections().toArray();
        console.log('\n--- Collections in CURRENT DB ---');
        for (const col of collections) {
            const count = await db.collection(col.name).countDocuments();
            console.log(`${col.name}: ${count} documents`);
        }

        // Check the other DB just in case
        const otherUri = uri.includes('/test') ? uri.replace('/test', '/hackathon') : uri.replace('/hackathon', '/test');
        console.log('\nConnecting to OTHER DB for comparison:', otherUri);

        const conn2 = await mongoose.createConnection(otherUri).asPromise();
        const db2 = conn2.db;
        if (!db2) throw new Error('Could not connect to second database');

        const collections2 = await db2.listCollections().toArray();

        console.log('\n--- Collections in OTHER DB ---');
        for (const col of collections2) {
            const count = await db2.collection(col.name).countDocuments();
            console.log(`${col.name}: ${count} documents`);
        }

        await mongoose.disconnect();
        await conn2.close();
    } catch (err) {
        console.error('Error:', err);
    }
}

checkData();
