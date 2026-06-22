import mongoose from 'mongoose';

async function clearCloudCache() {
    const uri = "mongodb+srv://meetmodi45:MeetModi-45@sportbuzz.bfrawfb.mongodb.net/SportBuzz?appName=SportBuzz";
    await mongoose.connect(uri);
    const db = mongoose.connection.db;
    const result = await db.collection('fotmobcaches').deleteMany({ endpoint: { $regex: '^/fotmob-player-stats' } });
    console.log(`Cleared ${result.deletedCount} cache entries from cloud DB.`);
    process.exit(0);
}

clearCloudCache();
