import mongoose from 'mongoose';
import Match from './models/Match.js';
import Team from './models/Team.js';
import Ball from './models/Ball.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/SportBuzz';

async function fixMatch() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        const teams = await Team.find({ name: { $in: ["Mumbai Indians", "GCET Mavericks"] } });
        const mi = teams.find(t => t.name === "Mumbai Indians");
        const gcet = teams.find(t => t.name === "GCET Mavericks");

        if (!mi || !gcet) {
            console.error('Could not find both teams');
            process.exit(1);
        }

        const match = await Match.findOne({
            $or: [
                { homeTeam: mi._id, awayTeam: gcet._id },
                { homeTeam: gcet._id, awayTeam: mi._id }
            ]
        }).populate('homeTeam awayTeam');

        if (!match) {
            console.error('Match not found');
            process.exit(1);
        }

        const balls = await Ball.find({ match: match._id }).sort({ inning: 1, over: 1, ball: 1 });
        
        let score1 = { runs: 0, wickets: 0 };
        let score2 = { runs: 0, wickets: 0 };
        let inn1Player = null;
        let inn2Player = null;

        balls.forEach(b => {
            if (b.isCommentaryOnly) return; 
            
            if (b.inning === 1) {
                if (!inn1Player && b.batsman !== 'Commentary') inn1Player = b.batsman;
                score1.runs += (b.runs || 0) + (b.extraRuns || 0);
                if (b.wicket && b.wicket.isWicket) score1.wickets++;
            } else if (b.inning === 2) {
                if (!inn2Player && b.batsman !== 'Commentary') inn2Player = b.batsman;
                score2.runs += (b.runs || 0) + (b.extraRuns || 0);
                if (b.wicket && b.wicket.isWicket) score2.wickets++;
            }
        });

        console.log(`Inn 1 Sample Batsman: ${inn1Player}, Score: ${score1.runs}/${score1.wickets}`);
        console.log(`Inn 2 Sample Batsman: ${inn2Player}, Score: ${score2.runs}/${score2.wickets}`);

        // Identify which team is which inning
        let battingFirstId, battingSecondId;
        const miPlayers = mi.players.map(p => p.name);
        
        if (miPlayers.includes(inn1Player)) {
            battingFirstId = mi._id;
            battingSecondId = gcet._id;
        } else {
            battingFirstId = gcet._id;
            battingSecondId = mi._id;
        }

        console.log(`Batting First: ${battingFirstId.equals(mi._id) ? 'MI' : 'GCET'}`);
        console.log(`Batting Second: ${battingSecondId.equals(mi._id) ? 'MI' : 'GCET'}`);

        let winnerId, margin;
        if (score2.runs > score1.runs) {
            winnerId = battingSecondId;
            const wicketsLeft = 10 - score2.wickets;
            margin = `${wicketsLeft} wickets`;
        } else if (score1.runs > score2.runs) {
            winnerId = battingFirstId;
            const runDiff = score1.runs - score2.runs;
            margin = `${runDiff} runs`;
        } else {
            margin = 'match tied';
        }

        const winnerTeam = teams.find(t => t._id.equals(winnerId));
        console.log(`CORRECT WINNER: ${winnerTeam?.name} (${margin})`);

        match.result.winner = winnerId;
        match.result.margin = margin;
        match.score.team1.runs = score1.runs;
        match.score.team1.wickets = score1.wickets;
        match.score.team2.runs = score2.runs;
        match.score.team2.wickets = score2.wickets;
        match.status = 'Completed';

        await match.save();
        console.log('Database updated successfully.');

        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

fixMatch();
