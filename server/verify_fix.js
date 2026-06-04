import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env
dotenv.config({ path: path.join(__dirname, '.env') });

const MatchSchema = new mongoose.Schema({
    homeTeam: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
    awayTeam: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
    tournament: { type: mongoose.Schema.Types.ObjectId, ref: 'Tournament' },
    venue: mongoose.Schema.Types.Mixed
});

const TeamSchema = new mongoose.Schema({
    name: String,
    players: mongoose.Schema.Types.Mixed
});

const Match = mongoose.model('Match', MatchSchema);
const Team = mongoose.model('Team', TeamSchema);

async function verify() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const match = await Match.findOne().populate('homeTeam awayTeam');
        if (!match) {
            console.log('No matches found');
            process.exit();
        }

        console.log('Match ID:', match._id);

        // Mock the Controller Logic
        const playerProfiles = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'playerProfiles.json'), 'utf8'));

        const extractPlayers = (team) => {
            if (!team || !team.players) return [];
            const rawPlayers = Array.isArray(team.players) ? team.players : [];
            return rawPlayers.map(p => {
                const name = (typeof p === 'string' ? p : p?.name) || '';
                let role = (typeof p === 'object' ? p?.role : 'Batter') || 'Batter';
                return { name: name.trim(), role: role };
            }).filter(p => p.name.length > 0 && p.name !== '...');
        };

        const homeSquad = extractPlayers(match.homeTeam);
        const awaySquad = extractPlayers(match.awayTeam);
        const allSquadPlayers = [...homeSquad, ...awaySquad];
        const homeNames = homeSquad.map(p => p.name);

        console.log('Total Players Extracted:', allSquadPlayers.length);

        const analyzedPlayers = allSquadPlayers.map(player => {
            const name = player.name;
            const profile = playerProfiles.find(p => p.name.toLowerCase() === name.toLowerCase());
            const profileRating = profile ? profile.overallRating : 75;
            return {
                name,
                role: player.role,
                score: Math.round(profileRating * 0.7 + 70 * 0.3),
                isHome: homeNames.includes(name)
            };
        });

        const uniqueAnalyzed = Array.from(new Map(analyzedPlayers.map(p => [p.name, p])).values());
        console.log('Unique Analyzed:', uniqueAnalyzed.length);

        const sorted = [...uniqueAnalyzed].sort((a, b) => b.score - a.score);
        console.log('Top Player:', sorted[0]?.name, 'Score:', sorted[0]?.score);

        const inForm = sorted.slice(0, 4);
        console.log('In Form Count:', inForm.length);

        // Check Matchup logic
        const homeBatters = uniqueAnalyzed.filter(p => p.isHome && ['Batter', 'Wicketkeeper', 'All-Rounder', 'Batsman'].includes(p.role));
        const awayBowlers = uniqueAnalyzed.filter(p => !p.isHome && ['Bowler', 'All-Rounder'].includes(p.role));

        console.log('Home Batters:', homeBatters.length, 'Away Bowlers:', awayBowlers.length);

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

verify();
