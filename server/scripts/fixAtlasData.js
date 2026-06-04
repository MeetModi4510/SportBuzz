import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const fix = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to Atlas\n');

        const db = mongoose.connection.db;

        // Fix matches with missing matchType
        const matchResult = await db.collection('matches').updateMany(
            { matchType: { $exists: false } },
            { $set: { matchType: 'League' } }
        );
        console.log(`🔧 Fixed matchType on ${matchResult.modifiedCount} matches`);

        // Also fix null/undefined matchType
        const matchResult2 = await db.collection('matches').updateMany(
            { matchType: null },
            { $set: { matchType: 'League' } }
        );
        console.log(`🔧 Fixed null matchType on ${matchResult2.modifiedCount} more matches`);

        // Fix matches with missing status
        const statusResult = await db.collection('matches').updateMany(
            { status: { $exists: false } },
            { $set: { status: 'Upcoming' } }
        );
        console.log(`🔧 Fixed status on ${statusResult.modifiedCount} matches`);

        // Show final state of matches
        const matches = await db.collection('matches').find({}).toArray();
        console.log(`\n📊 All Matches after fix:`);
        matches.forEach(m => {
            console.log(`   [${m.status}] type:${m.matchType} | home:${String(m.homeTeam).slice(-6)} vs away:${String(m.awayTeam).slice(-6)}`);
        });

        await mongoose.connection.close();
        console.log('\n✅ Done!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
};

fix();
