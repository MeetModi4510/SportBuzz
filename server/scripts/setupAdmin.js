import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const createAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const adminEmail = 'admin@sportbuzz.com';
        const adminPassword = 'AdminPassword123!';

        let admin = await User.findOne({ email: adminEmail });

        if (admin) {
            console.log('Admin user already exists. Updating role to admin...');
            admin.role = 'admin';
            await admin.save();
        } else {
            console.log('Creating new admin user...');
            admin = new User({
                fullName: 'SportBuzz Admin',
                email: adminEmail,
                password: adminPassword,
                role: 'admin',
                provider: 'local',
                securityQuestion: 'What is the name of this app?',
                securityAnswer: 'SportBuzz'
            });
            await admin.save();
        }

        console.log('Admin account setup successfully!');
        console.log(`Email: ${adminEmail}`);
        console.log(`Password: ${adminPassword}`);
        
        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('Error creating admin:', error);
        process.exit(1);
    }
};

createAdmin();
