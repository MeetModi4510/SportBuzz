import mongoose from 'mongoose';

async function check() {
    try {
        await mongoose.connect('mongodb://localhost:27017/sportsbuzz');
        const db = mongoose.connection.db;
        const balls = db.collection('balls');
        
        const players = await balls.distinct('batsman');
        console.log("Players with batting data:", players);
        
        for (const p of players.slice(0, 5)) {
            const count = await balls.countDocuments({ batsman: p });
            console.log(`Player: ${p}, Balls: ${count}`);
        }
        
        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
