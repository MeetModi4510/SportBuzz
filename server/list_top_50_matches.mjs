import axios from 'axios';

const KEY = '8c2b33ac-020f-4915-83bb-f30194ffe9a3'; // New key
const BASE = 'https://api.cricapi.com/v1';

async function listMatches() {
    console.log('Listing first 50 matches...');
    try {
        // Offset 0
        const { data: d1 } = await axios.get(`${BASE}/matches?apikey=${KEY}&offset=0`);
        const matches1 = d1.data || [];
        matches1.forEach(m => console.log(`${m.name} | ID: ${m.id} | Status: ${m.status}`));

        // Offset 25
        const { data: d2 } = await axios.get(`${BASE}/matches?apikey=${KEY}&offset=25`);
        const matches2 = d2.data || [];
        matches2.forEach(m => console.log(`${m.name} | ID: ${m.id} | Status: ${m.status}`));

    } catch (err) {
        console.error('Error:', err.message);
    }
}

listMatches();
