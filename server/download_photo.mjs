import axios from 'axios';
import fs from 'fs';
import path from 'path';

const RAPIDAPI_KEY = '85fb58db70msh50c5add33399bccp10e19ajsn6083f7bc3e30';
const RAPIDAPI_HOST = 'world-cup-2026.p.rapidapi.com';
const BASE = 'https://world-cup-2026.p.rapidapi.com';

const headers = {
    'x-rapidapi-key': RAPIDAPI_KEY,
    'x-rapidapi-host': RAPIDAPI_HOST
};

async function downloadPhoto(playerName, filename) {
    try {
        console.log(`Downloading photo for ${playerName}...`);
        const res = await axios.get(`${BASE}/world-cup-2026/player-photo/${encodeURIComponent(playerName)}`, { 
            headers,
            responseType: 'arraybuffer'
        });
        
        fs.writeFileSync(filename, res.data);
        console.log(`Saved ${playerName} photo to ${filename}`);
    } catch (err) {
        console.error(`FAIL for ${playerName}:`, err.message);
    }
}

async function main() {
    const outPath = 'C:\\Users\\PRANSHU PATEL\\.gemini\\antigravity-ide\\brain\\7dc4cd1f-1b79-48ea-9729-81f251ed78cc\\messi.jpg';
    await downloadPhoto('Lionel Messi', outPath);
}

main();
