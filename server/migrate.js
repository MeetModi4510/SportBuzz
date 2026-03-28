import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const LOCAL_URI = 'mongodb://127.0.0.1:27017/SportBuzz';
// The user should set ATLAS_URI in their .env
const ATLAS_URI = process.env.ATLAS_URI;

if (!ATLAS_URI) {
    console.error('❌ ERROR: Please add your ATLAS_URI to server/.env (e.g., ATLAS_URI=mongodb+srv://pranshun88:YOURPASSWORD@cluster0.xxxxx.mongodb.net/SportBuzz)');
    process.exit(1);
}

const migrateData = async () => {
    try {
        console.log('Connecting to Local Database...');
        const localDb = await mongoose.createConnection(LOCAL_URI).asPromise();
        
        console.log('Connecting to Atlas Database...');
        const atlasDb = await mongoose.createConnection(ATLAS_URI).asPromise();

        console.log('--- Connected to both databases successfully ---');

        // Get all collections from local DB
        const collections = await localDb.db.listCollections().toArray();
        const collectionNames = collections.map(c => c.name);

        for (const name of collectionNames) {
            console.log(`\nMigrating collection: ${name}...`);
            const localCollection = localDb.collection(name);
            const atlasCollection = atlasDb.collection(name);

            // Fetch all documents from local
            const docs = await localCollection.find({}).toArray();
            
            if (docs.length === 0) {
                console.log(`- 0 documents found in ${name}, skipping.`);
                continue;
            }

            // Clear destination collection just in case
            await atlasCollection.deleteMany({});
            
            // Insert documents into atlas
            await atlasCollection.insertMany(docs);
            console.log(`✅ Successfully copied ${docs.length} documents for ${name}!`);
        }

        console.log('\n🎉 All local data has been successfully migrated to MongoDB Atlas!');
        process.exit(0);

    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

migrateData();
