import mongoose from 'mongoose';
import Match from './Match.js';
import Team from './Team.js';
import Ball from './Ball.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/SportBuzz';

async function fixMatch() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        const teams = await Team.find({ name: { $in: [/Mumbai Indians/i, /GCET Mavericks/i, /GCET/i] } });
        console.log('Found teams:', teams.map(t => ({ id: t._id, name: t.name })));

        const mi = teams.find(t => t.name.match(/Mumbai Indians/i));
        const gcet = teams.find(t => t.name.match(/GCET/i));

        if (!mi || !gcet) {
            console.error('Could not find both teams');
            process.exit(1);
        }

        const match = await Match.findOne({
            $or: [
                { homeTeam: mi._id, awayTeam: gcet._id },
                { homeTeam: gcet._id, awayTeam: mi._id }
            ],
            status: 'Completed'
        }).populate('homeTeam awayTeam');

        if (!match) {
            console.error('Match not found');
            process.exit(1);
        }

        console.log(`Found match: ${match.homeTeam.name} vs ${match.awayTeam.name} (${match._id})`);
        console.log(`Current Result: ${match.result?.margin}, Winner ID: ${match.result?.winner}`);

        // Fetch all balls for this match to recalculate
        const balls = await Ball.find({ match: match._id }).sort({ inning: 1, over: 1, ball: 1 });
        console.log(`Found ${balls.length} balls`);

        let score1 = { runs: 0, wickets: 0, overs: 0 };
        let score2 = { runs: 0, wickets: 0, overs: 0 };

        balls.forEach(b => {
            if (b.inning === 1) {
                score1.runs += (b.runs || 0) + (b.extraRuns || 0);
                if (b.wicket && b.wicket.isWicket) score1.wickets++;
            } else if (b.inning === 2) {
                score2.runs += (b.runs || 0) + (b.extraRuns || 0);
                if (b.wicket && b.wicket.isWicket) score2.wickets++;
            }
        });

        console.log(`Recalculated Scores: Inn1: ${score1.runs}/${score1.wickets}, Inn2: ${score2.runs}/${score2.wickets}`);

        const tossWinnerId = match.toss.win.toString();
        const tossDecision = match.toss.decision; // 'Batting' or 'Bowling'
        
        const homeTeamId = match.homeTeam._id.toString();
        const awayTeamId = match.awayTeam._id.toString();

        let battingFirstId, battingSecondId;
        if (tossWinnerId === homeTeamId) {
            if (tossDecision === 'Batting') {
                battingFirstId = homeTeamId;
                battingSecondId = awayTeamId;
            } else {
                battingFirstId = awayTeamId;
                battingSecondId = homeTeamId;
            }
        } else {
            if (tossDecision === 'Batting') {
                battingFirstId = awayTeamId;
                battingSecondId = homeTeamId;
            } else {
                battingFirstId = homeTeamId;
                battingSecondId = awayTeamId;
            }
        }

        let winnerId, margin;
        if (score2.runs > score1.runs) {
            winnerId = battingSecondId;
            const wicketsLeft = 10 - score2.wickets;
            margin = `won by ${wicketsLeft} wickets`;
        } else if (score1.runs > score2.runs) {
            winnerId = battingFirstId;
            const runDiff = score1.runs - score2.runs;
            margin = `won by ${runDiff} runs`;
        } else {
            match.result.isTie = true;
            margin = 'match tied';
        }

        const winnerTeam = teams.find(t => t._id.toString() === winnerId);
        console.log(`Correct Winner: ${winnerTeam?.name} (${margin})`);

        match.result.winner = winnerId;
        match.result.margin = margin;
        match.score.team1.runs = score1.runs;
        match.score.team1.wickets = score1.wickets;
        match.score.team2.runs = score2.runs;
        match.score.team2.wickets = score2.wickets;

        await match.save();
        console.log('Match record updated successfully');

        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

fixMatch();
