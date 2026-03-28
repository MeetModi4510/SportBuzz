import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';
import Match from '../models/Match.js';
import Tournament from '../models/Tournament.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const countRecords = async () => {
    try {
        console.log('Connecting to:', process.env.MONGO_URI);
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const [users, matches, tournaments, liveMatches] = await Promise.all([
            User.countDocuments(),
            Match.countDocuments(),
            Tournament.countDocuments(),
            Match.countDocuments({ status: 'Live' })
        ]);

        console.log('\n--- Record Counts ---');
        console.log('Total Users:', users);
        console.log('Total Matches:', matches);
        console.log('Total Tournaments:', tournaments);
        console.log('Live Matches:', liveMatches);

        if (users > 0) {
            const firstUser = await User.findOne().select('fullName email role');
            console.log('\nSample User:', firstUser);
        }

        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('Error counting records:', error);
        process.exit(1);
    }
};

countRecords();
