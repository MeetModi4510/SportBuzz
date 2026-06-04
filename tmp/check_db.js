import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), 'server', '.env') });

async function checkDB() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");

        const tournaments = await mongoose.connection.db.collection('tournaments').find({}).toArray();
        console.log(`Found ${tournaments.length} tournaments`);
        
        if (tournaments.length > 0) {
            console.log("First tournament sample:", JSON.stringify(tournaments[0], null, 2));
        }

        const teams = await mongoose.connection.db.collection('teams').find({}).toArray();
        console.log(`Found ${teams.length} teams`);

        await mongoose.disconnect();
    } catch (err) {
        console.error("DB Check Failed:", err);
    }
}

checkDB();
