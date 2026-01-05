import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const diagnose = async () => {
    try {
        console.log('🔗 Connecting to Atlas...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected!\n');

        const db = mongoose.connection.db;

        // List all collections and count documents in each
        const collections = await db.listCollections().toArray();
        console.log(`📦 Collections found in Atlas: ${collections.length}\n`);

        const results = [];
        for (const col of collections) {
            const count = await db.collection(col.name).countDocuments();
            results.push({ collection: col.name, count });
        }

        // Sort by count descending
        results.sort((a, b) => b.count - a.count);

        console.log('--- Collection Document Counts ---');
        results.forEach(r => {
            const bar = r.count > 0 ? '✅' : '⚠️ EMPTY';
            console.log(`  ${bar}  ${r.collection.padEnd(25)} → ${r.count} documents`);
        });

        const empty = results.filter(r => r.count === 0);
        const populated = results.filter(r => r.count > 0);

        console.log(`\n📊 Summary:`);
        console.log(`   Populated: ${populated.length} collections`);
        console.log(`   Empty:     ${empty.length} collections`);

        if (empty.length > 0) {
            console.log(`\n❌ Empty collections (data missing from Atlas):`);
            empty.forEach(r => console.log(`   - ${r.collection}`));
            console.log('\n💡 These collections need to be migrated from local MongoDB.');
        }

        // Check Player data specifically since it affects several features
        const players = await db.collection('players').find({}).limit(3).toArray();
        if (players.length > 0) {
            console.log('\n👤 Sample Players:');
            players.forEach(p => console.log(`   - ${p.name || p.fullName || JSON.stringify(Object.keys(p))}`));
        }

        // Check Teams
        const teams = await db.collection('teams').find({}).limit(3).toArray();
        if (teams.length > 0) {
            console.log('\n🏆 Sample Teams:');
            teams.forEach(t => console.log(`   - ${t.name || JSON.stringify(Object.keys(t))}`));
        }

        // Check Tournaments
        const tournaments = await db.collection('tournaments').find({}).limit(5).toArray();
        if (tournaments.length > 0) {
            console.log('\n🏟️ Tournaments:');
            tournaments.forEach(t => console.log(`   - ${t.name} (sport: ${t.sport}, status: ${t.status})`));
        }

        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
};

diagnose();
