import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from the correct path
dotenv.config({ path: path.join(__dirname, 'src', '.env') });
if (!process.env.MONGODB_URI) {
    dotenv.config({ path: path.join(__dirname, '.env') });
}

const url = process.env.MONGODB_URI || 'mongodb://localhost:27017/test';

const UserSchema = new mongoose.Schema({
    name: String,
    email: String,
    role: String
}, { collection: 'users' });

const User = mongoose.model('User', UserSchema);

const checkUsers = async () => {
    try {
        await mongoose.connect(url);
        console.log('✅ Connected to MongoDB');

        const users = await User.find({}, 'name email role');
        console.log('\n--- ALL USERS ---');
        console.table(users.map((u: any) => ({
            name: u.name,
            email: u.email,
            role: u.role
        })));

        process.exit(0);
    } catch (err) {
        console.error('❌ Error checking users:', err);
        process.exit(1);
    }
};

checkUsers();
