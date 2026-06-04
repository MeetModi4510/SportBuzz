import axios from 'axios';

const KEY = '10d3fca6-f7ac-476b-8b3f-f3b631a5d358';
const BASE = 'https://api.cricapi.com/v1';

async function deepSearchMatch() {
    console.log('Starting DEEP search for AUS vs ZIM...');

    // Check /currentMatches first - it's the most likely place for a LIVE match
    // If it's not here, it's weird.
    try {
        console.log('Checking /currentMatches...');
        const cmRes = await axios.get(`${BASE}/currentMatches?apikey=${KEY}&offset=0`);
        const currentMatches = cmRes.data.data || [];
        const cmMatch = currentMatches.find(m =>
            (m.name && (m.name.includes('Australia') || m.name.includes('AUS'))) &&
            (m.name.includes('Zimbabwe') || m.name.includes('ZIM'))
        );

        if (cmMatch) {
            console.log(`\nFOUND IN /currentMatches!`);
            console.log(`ID: ${cmMatch.id}`);
            console.log(`Score:`, JSON.stringify(cmMatch.score, null, 2));
            return;
        } else {
            console.log('Not found in /currentMatches.');
        }

        // Check Series List
        console.log('Checking all series (offset 0-50)...');
        for (let offset = 0; offset <= 25; offset += 25) {
            const sRes = await axios.get(`${BASE}/series?apikey=${KEY}&offset=${offset}`);
            const seriesList = sRes.data.data || [];

            for (const s of seriesList) {
                // Focus on 2026/2025 series
                if (!s.name.includes('2026') && !s.name.includes('2025')) continue;

                console.log(`Checking series: ${s.name} (${s.id})`);
                const infoRes = await axios.get(`${BASE}/series_info?apikey=${KEY}&id=${s.id}`);
                const matches = infoRes.data.data?.matchList || [];

                const match = matches.find(m =>
                    (m.name && (m.name.includes('Australia') || m.name.includes('AUS'))) &&
                    (m.name.includes('Zimbabwe') || m.name.includes('ZIM'))
                );

                if (match) {
                    console.log(`\nFOUND IN SERIES: ${s.name}`);
                    console.log(`Match: ${match.name}`);
                    console.log(`ID: ${match.id}`);
                    console.log(`Score (from series):`, JSON.stringify(match.score, null, 2));

                    // Fetch match_info just to be sure
                    console.log(`Fetching match_info...`);
                    const mRes = await axios.get(`${BASE}/match_info?apikey=${KEY}&id=${match.id}`);
                    console.log(`Score (from match_info):`, JSON.stringify(mRes.data.data?.score, null, 2));
                    return;
                }
            }
        }

        console.log('Match NOT FOUND anywhere.');

    } catch (err) {
        console.error('Error:', err.message);
    }
}

deepSearchMatch();
