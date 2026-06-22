import mongoose from 'mongoose';

async function clearCache() {
    await mongoose.connect('mongodb://127.0.0.1:27017/sportbuzz');
    const db = mongoose.connection.db;
    const result = await db.collection('fotmobcaches').deleteMany({ endpoint: { $regex: '^/fotmob-player-stats' } });
    console.log(`Cleared ${result.deletedCount} cache entries.`);
    process.exit(0);
}

clearCache();
