import mongoose from 'mongoose';
import dotenv from 'dotenv';
import axios from 'axios';
import { PlayerTopStat, TeamTopStat } from './models/FootballTopStat.js';

dotenv.config();

const LIVESCORE_HOST = 'livescore6.p.rapidapi.com';

const PLAYER_STAT_TYPES = [
    { typ: 1, label: 'Goals' },
    { typ: 3, label: 'Assists' },
    { typ: 4, label: 'Defenders' },
    { typ: 6, label: 'Midfielders' },
    { typ: 8, label: 'Overall' },
];

async function fetchAndStoreTopStatsForLeague(league, apiKey) {
    const now = new Date();
    const cacheExpiry = new Date(Date.now() + 4 * 24 * 60 * 60 * 1000);

    const playerRes = await axios.get(`https://${LIVESCORE_HOST}/competitions/get-player-stats`, {
        params: { CompId: league.id },
        headers: { 'x-rapidapi-host': LIVESCORE_HOST, 'x-rapidapi-key': apiKey },
        timeout: 12000,
    });
    
    console.log("Player Response:", JSON.stringify(playerRes.data).substring(0, 500));

    const playerStats = playerRes.data?.Stat || [];
    const playerDocs = [];

    for (const stat of playerStats) {
        const typInfo = PLAYER_STAT_TYPES.find(t => t.typ === stat.Typ);
        if (!typInfo) continue;
        const plrs = stat.Plrs || [];
        for (const p of plrs) {
            const statVal = p.Scrs ? Object.values(p.Scrs)[0] : '0';
            
            playerDocs.push({
                leagueId:     league.id,
                leagueName:   league.name,
                statTyp:      stat.Typ,
                rank:         p.Rnk || 0,
                playerName:   p.Pnm || '',
                playerId:     p.Pid || p.Aid || '',
                teamName:     p.Tnm || '',
                teamId:       p.Tid || '',
                statValue:    statVal,
                imageUrl:     p.imageUrl || '',
                teamBadgeUrl: p.Img || '',
                cacheExpiry,
                lastFetched:  now,
            });
        }
    }
    
    console.log(`Prepared ${playerDocs.length} player docs.`);
    return playerDocs;
}

async function run() {
    await mongoose.connect(process.env.MONGODB_URI);
    const apiKey = process.env.livescore_api_footballtopstats;
    const league = { id: 734, name: 'World Cup' };
    
    const docs = await fetchAndStoreTopStatsForLeague(league, apiKey);
    console.log(docs.slice(0, 2));
    
    process.exit(0);
}

run();
