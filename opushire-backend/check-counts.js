const { MongoClient } = require('mongodb');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function run() {
    const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/test";
    console.log('Using URI:', uri);
    const client = new MongoClient(uri);

    try {
        await client.connect();
        console.log('Connected to MongoDB');

        // Check 'test' db
        const testDb = client.db('test');
        console.log('\n--- Database: test ---');
        const testCollections = await testDb.listCollections().toArray();
        for (const col of testCollections) {
            const count = await testDb.collection(col.name).countDocuments();
            console.log(`${col.name}: ${count}`);
        }

        // Check 'hackathon' db
        const hackDb = client.db('hackathon');
        console.log('\n--- Database: hackathon ---');
        const hackCollections = await hackDb.listCollections().toArray();
        for (const col of hackCollections) {
            const count = await hackDb.collection(col.name).countDocuments();
            console.log(`${col.name}: ${count}`);
        }

    } catch (err) {
        console.error(err);
    } finally {
        await client.close();
    }
}

run();
