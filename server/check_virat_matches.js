import mongoose from 'mongoose';

async function check() {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/SportBuzz');
        const db = mongoose.connection.db;
        const matches = db.collection('matches');
        const balls = db.collection('balls');
        
        // Find all unique match IDs where Virat Kohli played
        const viratMatchIds = await balls.distinct('match', { batsman: 'Virat Kohli' });
        console.log("Match IDs for Virat Kohli:", viratMatchIds);
        
        for (const mid of viratMatchIds) {
            const match = await matches.findOne({ _id: mid });
            if (match) {
                console.log(`Match ${mid}: Status=${match.status}, Format=${match.format}`);
            } else {
                console.log(`Match ${mid}: NOT FOUND in matches collection`);
            }
        }
        
        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
