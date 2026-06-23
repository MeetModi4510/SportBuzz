import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import FootballTransfer from './models/FootballTransfer.js';

async function clearCache() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');
        await FootballTransfer.deleteMany({});
        console.log('Cleared FootballTransfer cache');
        mongoose.disconnect();
    } catch (e) {
        console.error('Error clearing cache', e);
        mongoose.disconnect();
    }
}

clearCache();
