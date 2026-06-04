const mongoose = require('mongoose');

async function check() {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/SportBuzz');
        const db = mongoose.connection.db;
        const matches = db.collection('matches');
        
        // Find matches where Virat Kohli played
        const viratMatches = await db.collection('balls').distinct('matchId', { batsman: 'Virat Kohli' });
        console.log("Match IDs for Virat Kohli:", viratMatches);
        
        for (const mid of viratMatches) {
            const match = await matches.findOne({ _id: mid });
            if (match) {
                console.log(`Match ${mid}: Status=${match.status}, Format=${match.format}`);
            } else {
                // Try searching by string ID if mid is a string
                const matchStr = await matches.findOne({ _id: mid.toString() });
                if (matchStr) {
                    console.log(`Match ${mid} (string): Status=${matchStr.status}, Format=${matchStr.format}`);
                } else {
                    console.log(`Match ${mid}: NOT FOUND in matches collection`);
                }
            }
        }
        
        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
