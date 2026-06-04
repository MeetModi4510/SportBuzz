import axios from 'axios';

const KEY = '8c2b33ac-020f-4915-83bb-f30194ffe9a3'; // New key
const BASE = 'https://api.cricapi.com/v1';

async function findLiveMatches() {
    console.log('Searching for LIVE matches (matchStarted=true, matchEnded=false) in /matches...');

    try {
        let found = 0;
        // Check first 3 pages (75 matches)
        for (let offset of [0, 25, 50]) {
            const { data } = await axios.get(`${BASE}/matches?apikey=${KEY}&offset=${offset}`);
            const matches = data.data || [];

            for (const m of matches) {
                if (m.matchStarted && !m.matchEnded) {
                    console.log(`\nFOUND LIVE MATCH: ${m.name}`);
                    console.log(`ID: ${m.id}`);
                    console.log(`Status: ${m.status}`);
                    console.log(`Score:`, JSON.stringify(m.score, null, 2));

                    if (m.name.includes('Australia') || m.name.includes('Zimbabwe')) {
                        console.log('*** THIS IS THE MATCH! ***');
                    }
                    found++;
                }
            }
        }

        if (found === 0) {
            console.log('No LIVE matches found in first 75 results.');
        }

    } catch (err) {
        console.error('API Error:', err.message);
    }
}

findLiveMatches();
