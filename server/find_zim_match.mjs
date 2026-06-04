import axios from 'axios';

const KEY = '8c2b33ac-020f-4915-83bb-f30194ffe9a3'; // New key
const BASE = 'https://api.cricapi.com/v1';

async function findZimMatch() {
    console.log('Searching /matches for "Zimbabwe" with NEW KEY (offset 0-50)...');

    try {
        // Offset 0
        const { data: d1 } = await axios.get(`${BASE}/matches?apikey=${KEY}&offset=0`);
        const matches1 = d1.data || [];
        const m1 = matches1.find(m => m.name.includes('Zimbabwe') || m.name.includes('ZIM'));
        if (m1) {
            console.log(`FOUND ZIM Match (Offset 0): ${m1.name}`);
            console.log(`ID: ${m1.id}`);
            console.log(`Status: ${m1.status}`);
            console.log(`Score:`, JSON.stringify(m1.score, null, 2));
            return;
        }

        // Offset 25
        const { data: d2 } = await axios.get(`${BASE}/matches?apikey=${KEY}&offset=25`);
        const matches2 = d2.data || [];
        const m2 = matches2.find(m => m.name.includes('Zimbabwe') || m.name.includes('ZIM'));
        if (m2) {
            console.log(`FOUND ZIM Match (Offset 25): ${m2.name}`);
            console.log(`ID: ${m2.id}`);
            console.log(`Status: ${m2.status}`);
            console.log(`Score:`, JSON.stringify(m2.score, null, 2));
            return;
        }

        console.log('No Zimbabwe match found in first 50 matches.');

    } catch (err) {
        console.error('API Error:', err.message);
    }
}

findZimMatch();
