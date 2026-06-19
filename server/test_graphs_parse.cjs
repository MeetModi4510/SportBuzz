const fs = require('fs');
const txt = fs.readFileSync('graphs_payload.txt', 'utf8');

const queries = ['ballMap', 'winProbability', 'partnership', 'partnerships', 'winProb'];

for (const q of queries) {
    const idx = txt.indexOf(`"${q}"`);
    if (idx !== -1) {
        console.log(`Found "${q}" at index ${idx}`);
        const snippet = txt.substring(idx - 20, idx + 200);
        console.log(`Snippet: ${snippet}\n`);
    } else {
        console.log(`Did not find "${q}"`);
    }
}
