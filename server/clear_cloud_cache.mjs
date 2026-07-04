import mongoose from 'mongoose';
import 'dotenv/config';

async function clearCloudCache() {
    const uri = process.env.MONGODB_URI;
    await mongoose.connect(uri);
    const db = mongoose.connection.db;
    const result = await db.collection('fotmobcaches').deleteMany({ endpoint: { $regex: '^/fotmob-player-stats' } });
    console.log(`Cleared ${result.deletedCount} cache entries from cloud DB.`);
    process.exit(0);
}

clearCloudCache();
