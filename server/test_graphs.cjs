const axios = require('axios');
const fs = require('fs');

async function testGraphs() {
    try {
        const url = 'https://www.cricbuzz.com/live-cricket-graphs/129563/eng-vs-nz-2nd-test-new-zealand-tour-of-england-2026';
        console.log('Fetching:', url);
        const res = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        fs.writeFileSync('graphs_payload.txt', res.data);
        console.log('Saved to graphs_payload.txt. Length:', res.data.length);
    } catch(e) {
        console.error('Failed to fetch graphs:', e.message);
    }
}
testGraphs();
