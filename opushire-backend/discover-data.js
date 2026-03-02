const { MongoClient } = require('mongodb');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function run() {
    const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/test";
    console.log('Searching across ALL databases at:', uri.split('@').pop());
    const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });

    try {
        await client.connect();
        const admin = client.db().admin();
        const dbs = await admin.listDatabases();

        for (const dbInfo of dbs.databases) {
            if (['admin', 'local', 'config'].includes(dbInfo.name)) continue;

            console.log(`\n📂 Database: ${dbInfo.name}`);
            const db = client.db(dbInfo.name);
            const collections = await db.listCollections().toArray();

            for (const col of collections) {
                const count = await db.collection(col.name).countDocuments();
                if (count > 0) {
                    console.log(`  ✅ ${col.name}: ${count} docs`);
                    // Peak at one doc to see structure
                    const doc = await db.collection(col.name).findOne();
                    console.log(`     Sample: ${JSON.stringify(doc).substring(0, 100)}...`);
                } else {
                    console.log(`  empty: ${col.name}`);
                }
            }
        }

    } catch (err) {
        console.error('❌ Error:', err.message);
    } finally {
        await client.close();
    }
}

run();
