import axios from 'axios';

const KEY = '8c2b33ac-020f-4915-83bb-f30194ffe9a3'; // New key
const BASE = 'https://api.cricapi.com/v1';

async function checkAllMatches() {
    console.log('Checking /matches endpoint...');
    try {
        const { data } = await axios.get(`${BASE}/matches?apikey=${KEY}&offset=0`);
        const allMatches = data.data || [];

        const match = allMatches.find(m =>
            (m.name && (m.name.includes('Australia') || m.name.includes('AUS'))) &&
            (m.name.includes('Zimbabwe') || m.name.includes('ZIM'))
        );

        if (match) {
            console.log(`\nFOUND IN /matches!`);
            console.log(`ID: ${match.id}`);
            console.log(`Status: ${match.status}`);
            console.log(`Match Started: ${match.matchStarted}`);
            console.log(`Score:`, JSON.stringify(match.score, null, 2));

            // If found here, let's fetch match_info for it
            console.log(`Fetching match_info...`);
            const mRes = await axios.get(`${BASE}/match_info?apikey=${KEY}&id=${match.id}`);
            console.log(`Score (from match_info):`, JSON.stringify(mRes.data.data?.score, null, 2));
        } else {
            console.log('Not found in /matches either.');
        }

    } catch (err) {
        console.error('Error:', err.message);
    }
}

checkAllMatches();
