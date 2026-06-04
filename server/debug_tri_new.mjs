import axios from 'axios';

const KEY = '8c2b33ac-020f-4915-83bb-f30194ffe9a3'; // New key
const BASE = 'https://api.cricapi.com/v1';

async function searchTriangular() {
    console.log('Searching "Triangular" series with NEW KEY...');
    try {
        const sRes = await axios.get(`${BASE}/series?apikey=${KEY}&search=Triangular`);
        const seriesList = sRes.data.data || [];

        console.log(`Found ${seriesList.length} series.`);

        for (const s of seriesList) {
            console.log(`Checking series: ${s.name} (${s.id})`);

            // Only check if it looks relevant (2025/2026 or Zimbabwe)
            // Actually check ALL just in case

            const infoRes = await axios.get(`${BASE}/series_info?apikey=${KEY}&id=${s.id}`);
            const matches = infoRes.data.data?.matchList || [];

            const match = matches.find(m =>
                (m.name && (m.name.includes('Australia') || m.name.includes('AUS')))
            );

            if (match) {
                console.log(`\nFOUND IN SERIES: ${s.name}`);
                console.log(`Match: ${match.name}`);
                console.log(`ID: ${match.id}`);
                console.log(`Score:`, JSON.stringify(match.score, null, 2));
                return;
            }
        }

        console.log('Match NOT FOUND in Triangular search.');

    } catch (err) {
        console.error('Error:', err.message);
    }
}

searchTriangular();
