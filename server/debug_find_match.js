import mongoose from 'mongoose';
import Match from './models/Match.js';
import Team from './models/Team.js';
import Ball from './models/Ball.js';
import dotenv from 'dotenv';

dotenv.config();

async function checkMatch() {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/SportBuzz');
    
    const mi = await Team.findOne({ name: 'Mumbai Indians' });
    const gcet = await Team.findOne({ name: 'GCET Mavericks' });
    
    if (!mi || !gcet) {
        console.log('MI:', !!mi, 'GCET:', !!gcet);
        process.exit(1);
    }
    
    const matches = await Match.find({ 
        $or: [
            { homeTeam: mi._id, awayTeam: gcet._id },
            { homeTeam: gcet._id, awayTeam: mi._id }
        ]
    }).populate('homeTeam awayTeam result.winner');
    
    console.log('FOUND MATCHES:', matches.length);
    matches.forEach(m => {
        console.log(`MATCH ID: ${m._id}`);
        console.log(`${m.homeTeam.name} vs ${m.awayTeam.name}`);
        console.log(`STATUS: ${m.status}`);
        console.log(`WINNER: ${m.result?.winner?.name || 'NONE'}`);
        console.log(`MARGIN: ${m.result?.margin || 'NONE'}`);
    });
    
    process.exit(0);
}

checkMatch();
