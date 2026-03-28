import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const checkAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const admin = await User.findOne({ email: 'admin@sportbuzz.com' });
        if (admin) {
            console.log('User found:');
            console.log(`Email: ${admin.email}`);
            console.log(`Role: ${admin.role}`);
            console.log(`ID: ${admin._id}`);
        } else {
            console.log('Admin user NOT found');
        }

        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('Error checking admin:', error);
        process.exit(1);
    }
};

checkAdmin();
