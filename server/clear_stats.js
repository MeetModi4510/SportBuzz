import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Player from './models/Player.js';

dotenv.config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
    console.log("Connected. Clearing stats...");
    await Player.updateMany({}, { $unset: { stats: 1 } });
    console.log("Done.");
    process.exit(0);
});
