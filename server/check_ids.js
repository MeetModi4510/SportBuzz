import mongoose from 'mongoose';

async function check() {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/SportBuzz');
        const db = mongoose.connection.db;
        const matches = db.collection('matches');
        
        const oneMatch = await matches.findOne({});
        console.log("Sample Match _id:", oneMatch._id);
        console.log("Sample Match _id type:", typeof oneMatch._id);
        
        const oneBall = await db.collection('balls').findOne({});
        console.log("Sample Ball match field:", oneBall.match);
        console.log("Sample Ball match field type:", typeof oneBall.match);

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
