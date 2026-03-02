const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const sourceDbName = 'hackathon';
const targetDbName = 'test';

async function migrate() {
    const baseUri = process.env.MONGODB_URI;
    if (!baseUri) {
        console.error('❌ MONGODB_URI is not defined in the environment variables');
        process.exit(1);
    }

    // Try to replace the database name in the URI or append it
    const getUri = (dbName) => {
        if (baseUri.includes('/' + targetDbName)) return baseUri.replace('/' + targetDbName, '/' + dbName);
        if (baseUri.includes('/' + sourceDbName)) return baseUri.replace('/' + sourceDbName, '/' + dbName);
        // If no DB name at the end, just append it (simple case)
        if (baseUri.endsWith('/')) return baseUri + dbName;
        return baseUri + '/' + dbName;
    };

    const sourceUri = getUri(sourceDbName);
    const targetUri = getUri(targetDbName);

    console.log(`🚀 Starting migration from [${sourceDbName}] to [${targetDbName}]`);
    console.log(`📡 Source: ${sourceUri.split('@').pop()}`);
    console.log(`📡 Target: ${targetUri.split('@').pop()}`);

    try {
        const sourceConn = await mongoose.createConnection(sourceUri).asPromise();
        console.log('✅ Connected to Source DB');

        const targetConn = await mongoose.createConnection(targetUri).asPromise();
        console.log('✅ Connected to Target DB');

        const collections = ['jobs', 'applications'];
        const results = {};

        // 1. Handle Users (Split into Students and Recruiters)
        console.log(`\n👥 Processing collection: users (splitting into students and recruiters)`);
        const sourceUsersCol = sourceConn.db.collection('users');
        const users = await sourceUsersCol.find({}).toArray();
        console.log(`   Found ${users.length} users in source.`);

        let studentCount = 0;
        let recruiterCount = 0;

        for (const user of users) {
            try {
                if (user.role === 'student') {
                    await targetConn.db.collection('students').updateOne({ _id: user._id }, { $set: user }, { upsert: true });
                    studentCount++;
                } else if (user.role === 'recruiter') {
                    await targetConn.db.collection('recruiters').updateOne({ _id: user._id }, { $set: user }, { upsert: true });
                    recruiterCount++;
                } else {
                    // Default to students or handle admin if needed
                    await targetConn.db.collection('students').updateOne({ _id: user._id }, { $set: user }, { upsert: true });
                    studentCount++;
                }
            } catch (err) {
                console.error(`   ❌ Failed to migrate user ${user._id}:`, err.message);
            }
        }
        console.log(`   ✅ Migrated ${studentCount} students and ${recruiterCount} recruiters.`);
        results['students'] = studentCount;
        results['recruiters'] = recruiterCount;

        // 2. Handle Jobs and Applications
        for (const colName of collections) {
            console.log(`\n📦 Processing collection: ${colName}`);
            const sourceCol = sourceConn.db.collection(colName);
            const targetCol = targetConn.db.collection(colName);

            const docs = await sourceCol.find({}).toArray();
            console.log(`   Found ${docs.length} documents in source.`);

            if (docs.length > 0) {
                let inserted = 0;
                for (const doc of docs) {
                    try {
                        await targetCol.updateOne({ _id: doc._id }, { $set: doc }, { upsert: true });
                        inserted++;
                    } catch (err) {
                        console.error(`   ❌ Failed to migrate doc ${doc._id}:`, err.message);
                    }
                }
                console.log(`   ✅ Migrated ${inserted}/${docs.length} documents.`);
                results[colName] = inserted;
            } else {
                console.log(`   ℹ️ No documents to migrate for ${colName}.`);
                results[colName] = 0;
            }
        }

        console.log('\n--- 📊 MIGRATION SUMMARY ---');
        console.table(results);
        console.log('\n✅ Data consolidation to "test" complete!');
        console.log('💡 Note: Original data still remains in "hackathon" for safety.');

        await sourceConn.close();
        await targetConn.close();
        process.exit(0);
    } catch (err) {
        console.error('❌ Migration failed:', err.message);
        process.exit(1);
    }
}

migrate();
