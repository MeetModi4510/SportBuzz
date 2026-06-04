import axios from 'axios';

const KEY = '8c2b33ac-020f-4915-83bb-f30194ffe9a3'; // New key
const BASE = 'https://api.cricapi.com/v1';

async function deepSearchWithNewKey() {
    console.log('Searching Series list with NEW KEY...');
    try {
        // Search specifically for "Zimbabwe" series first
        const sRes = await axios.get(`${BASE}/series?apikey=${KEY}&search=Zimbabwe`);
        const seriesList = sRes.data.data || [];

        console.log(`Found ${seriesList.length} series matching 'Zimbabwe'.`);

        for (const s of seriesList) {
            console.log(`Checking series: ${s.name} (${s.id})`);
            const infoRes = await axios.get(`${BASE}/series_info?apikey=${KEY}&id=${s.id}`);
            const matches = infoRes.data.data?.matchList || [];

            const match = matches.find(m =>
                (m.name && (m.name.includes('Australia') || m.name.includes('AUS')))
            );

            if (match) {
                console.log(`\nFOUND IN SERIES: ${s.name}`);
                console.log(`Match: ${match.name}`);
                console.log(`ID: ${match.id}`);
                console.log(`Score (from series):`, JSON.stringify(match.score, null, 2));

                console.log(`Fetching match_info...`);
                const mRes = await axios.get(`${BASE}/match_info?apikey=${KEY}&id=${match.id}`);
                console.log(`Score (from match_info):`, JSON.stringify(mRes.data.data?.score, null, 2));
                return;
            }
        }

        console.log('Match NOT FOUND in search results.');

    } catch (err) {
        console.error('Error:', err.message);
    }
}

deepSearchWithNewKey();
