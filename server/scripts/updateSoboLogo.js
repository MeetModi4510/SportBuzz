import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        const db = mongoose.connection.db;
        const teams = await db.collection('teams').find({}).toArray();
        console.log(`Found ${teams.length} teams:`);
        
        for (const t of teams) {
            console.log(`- "${t.name}" (Acronym: "${t.acronym || ''}", Logo: "${t.logo || ''}")`);
            const nameLower = t.name.toLowerCase();
            let newLogo = null;

            if (nameLower.includes('sobo') || nameLower.includes('falcons') || nameLower.includes('smf')) {
                newLogo = '/flags/t20_mumbai_2026/sobo.png';
            } else if (nameLower.includes('maratha') || nameLower.includes('royals') || nameLower.includes('mscmr')) {
                newLogo = '/flags/t20_mumbai_2026/mscmr.png';
            }

            if (newLogo) {
                console.log(`  👉 Updating logo to ${newLogo}`);
                await db.collection('teams').updateOne(
                    { _id: t._id },
                    { $set: { logo: newLogo } }
                );
            }
        }

        console.log('✅ Done.');
        await mongoose.connection.close();
        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    }
};

run();
