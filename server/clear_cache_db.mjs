import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { PlayerTopStat, TeamTopStat } from './models/FootballTopStat.js';
import WorldCupStanding from './models/WorldCupStanding.js';

dotenv.config();

async function run() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const wcRes = await WorldCupStanding.deleteMany({});
        const pStatRes = await PlayerTopStat.deleteMany({});
        const tStatRes = await TeamTopStat.deleteMany({});
        
        console.log(`Cleared caches: ${wcRes.deletedCount} World Cup Standings, ${pStatRes.deletedCount} Player Stats, ${tStatRes.deletedCount} Team Stats.`);
    } catch (err) {
        console.error("Error clearing caches:", err);
    } finally {
        process.exit(0);
    }
}

run();
