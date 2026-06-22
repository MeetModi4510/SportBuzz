import mongoose from 'mongoose';

async function checkCache() {
    await mongoose.connect('mongodb://127.0.0.1:27017/sportbuzz');
    const db = mongoose.connection.db;
    const items = await db.collection('fotmobcaches').find({}).project({ endpoint: 1 }).toArray();
    console.log(items);
    process.exit(0);
}

checkCache();
