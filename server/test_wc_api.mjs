import axios from 'axios';

const RAPIDAPI_KEY = '85fb58db70msh50c5add33399bccp10e19ajsn6083f7bc3e30';
const RAPIDAPI_HOST = 'world-cup-2026.p.rapidapi.com';
const BASE = 'https://world-cup-2026.p.rapidapi.com';

const headers = {
    'x-rapidapi-key': RAPIDAPI_KEY,
    'x-rapidapi-host': RAPIDAPI_HOST
};

async function testPhoto(playerName) {
    try {
        console.log(`Fetching photo for ${playerName}...`);
        const res = await axios.get(`${BASE}/world-cup-2026/player-photo/${encodeURIComponent(playerName)}`, { 
            headers,
            responseType: 'arraybuffer' // so it doesn't print garbled text
        });
        console.log(`Status for ${playerName}: ${res.status}`);
        console.log(`Size: ${res.data.length} bytes\n`);
    } catch (err) {
        console.error(`FAIL for ${playerName}:`, err.response?.status, err.message, '\n');
    }
}

async function main() {
    await testPhoto('Lionel Messi');
    await testPhoto('patrick beach');
}

main();
