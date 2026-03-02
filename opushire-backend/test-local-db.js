const { MongoClient } = require('mongodb');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function run() {
    // Try 127.0.0.1 specifically
    const uri = "mongodb://127.0.0.1:27017/test";
    console.log('Connecting to:', uri);
    const client = new MongoClient(uri, { serverSelectionTimeoutMS: 2000 });

    try {
        await client.connect();
        console.log('✅ Connected!');
        const admin = client.db().admin();
        const dbs = await admin.listDatabases();

        for (const dbInfo of dbs.databases) {
            console.log(`\n📂 DB: ${dbInfo.name}`);
            const db = client.db(dbInfo.name);
            const cols = await db.listCollections().toArray();
            for (const col of cols) {
                const count = await db.collection(col.name).countDocuments();
                console.log(`  - ${col.name}: ${count}`);
            }
        }
    } catch (err) {
        console.error('❌ Error:', err.message);
    } finally {
        await client.close();
    }
}

run();
