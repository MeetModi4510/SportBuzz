import axios from 'axios';

const KEY = '10d3fca6-f7ac-476b-8b3f-f3b631a5d358';
const BASE = 'https://api.cricapi.com/v1';

async function fetchRawMatch() {
    console.log('Searching for AUS vs ZIM match...');
    try {
        // Step 1: Find match ID in /series_info (since previous searches failed in /currentMatches)
        // We know it exists because the dashboard is showing it!
        // We will list recent series and deep scan for the ID.

        console.log('Fetching recent series...');
        const { data } = await axios.get(`${BASE}/series?apikey=${KEY}&offset=0`);
        const seriesList = data.data || [];

        let matchId = null;

        for (const s of seriesList) {
            // Check series with relevant names/dates
            if (s.name.includes('2026') || s.name.includes('2025')) {
                const infoRes = await axios.get(`${BASE}/series_info?apikey=${KEY}&id=${s.id}`);
                const matches = infoRes.data.data?.matchList || [];

                const match = matches.find(m =>
                    (m.name && m.teams && m.teams.some(t => t.includes('Australia') || t.includes('Zimbabwe'))) ||
                    (m.name.includes('AUS') && m.name.includes('ZIM'))
                );

                if (match) {
                    console.log(`\nFOUND MATCH!`);
                    console.log(`Name: ${match.name}`);
                    console.log(`ID: ${match.id}`);
                    console.log(`Status: ${match.status}`);
                    console.log(`Match Started: ${match.matchStarted}`);
                    console.log(`Score (in series_info):`, JSON.stringify(match.score, null, 2));
                    matchId = match.id;
                    break;
                }
            }
        }

        if (matchId) {
            console.log(`\nFetching DETAILED /match_info for ${matchId}...`);
            const mRes = await axios.get(`${BASE}/match_info?apikey=${KEY}&id=${matchId}`);
            console.log(`Match Info Response:`);
            console.log(JSON.stringify(mRes.data, null, 2));
        } else {
            console.log('Could not find match ID in recent series.');
        }

    } catch (err) {
        console.error('Error:', err.message);
    }
}

fetchRawMatch();
