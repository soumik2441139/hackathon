const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const sourceDbName = 'hackathon';
const targetDbName = 'test';

async function migrate() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error('❌ MONGODB_URI is not defined in the environment variables');
        process.exit(1);
    }

    console.log(`🚀 Starting data reorganization in the active database`);
    console.log(`📡 URL: ${uri.split('@').pop()}`);

    try {
        const conn = await mongoose.createConnection(uri).asPromise();
        console.log(`✅ Connected to Database: ${conn.db.databaseName}`);

        const results = {};

        // 1. Reorganize Users
        console.log(`\n👥 Processing collection: users (splitting into specific collections)`);
        const usersCol = conn.db.collection('users');
        const users = await usersCol.find({}).toArray();

        console.log(`   Found ${users.length} total users to reorganize.`);

        let studentCount = 0;
        let recruiterCount = 0;
        let adminCount = 0;

        for (const user of users) {
            try {
                const targetCol = user.role === 'recruiter' ? 'recruiters' :
                    user.role === 'admin' ? 'admins' : 'students';

                await conn.db.collection(targetCol).updateOne({ _id: user._id }, { $set: user }, { upsert: true });

                if (user.role === 'recruiter') recruiterCount++;
                else if (user.role === 'admin') adminCount++;
                else studentCount++;
            } catch (err) {
                console.error(`   ❌ Failed to process user ${user._id}:`, err.message);
            }
        }

        console.log(`   ✅ Reorganized into: ${studentCount} students, ${recruiterCount} recruiters, and ${adminCount} admins.`);
        results['students'] = studentCount;
        results['recruiters'] = recruiterCount;
        results['admins'] = adminCount;

        console.log('\n--- 📊 SUMMARY ---');
        console.table(results);
        console.log('\n✅ Data reorganization complete!');

        await conn.close();
        process.exit(0);
    } catch (err) {
        console.error('❌ Reorganization failed:', err.message);
        process.exit(1);
    }
}

migrate();
