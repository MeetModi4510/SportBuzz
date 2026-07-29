import axios from 'axios';
import fs from 'fs';

// The match page gave us overs 1-40 (245 balls). The match has 105 overs.
// Let's see if HT has an API endpoint to paginate/get the rest.
// We know: matchId from the page is in the URL slug "sluinu07202026271827"
// The smallMatchId in pageProps will be useful

const nextData = JSON.parse(fs.readFileSync('ht_next_data.json', 'utf8'));
const smallMatchId = nextData.props.pageProps.smallMatchId;
const matchId = nextData.props.pageProps.matchId;
console.log('smallMatchId:', smallMatchId);
console.log('matchId:', matchId);

// Try to figure out the API they use to load more commentary
// Common patterns for HT / news sites:
const apiCandidates = [
    // Pattern 1: API with inning number
    `https://api.hindustantimes.com/cricket/commentary/${matchId}?inning=1&page=2`,
    `https://api.hindustantimes.com/cricket/commentary/${smallMatchId}?inning=1&page=2`,
    // Pattern 2: The /api/ route
    `https://www.hindustantimes.com/api/cricket/commentary/${smallMatchId}?inning=2`,
    `https://www.hindustantimes.com/cricket-api/commentary?matchId=${smallMatchId}&inning=1`,
    // Pattern 3: The sports data vendor they use (likely CricketAPI / ndtv-sports)
    `https://sports.hindustantimes.com/cricket/commentary/${smallMatchId}/2`,
    // Pattern 4: Next.js API routes
    `https://www.hindustantimes.com/api/cricket-commentary?matchId=${smallMatchId}&inning=2&page=1`,
];

const headers = {
    'User-Agent': 'Mozilla/5.0',
    'Referer': 'https://www.hindustantimes.com/',
    'Accept': 'application/json'
};

for (const url of apiCandidates) {
    console.log(`\nTrying: ${url}`);
    try {
        const res = await axios.get(url, { headers, timeout: 5000 });
        console.log(`Status: ${res.status}`);
        if (typeof res.data === 'object') {
            console.log(`Keys: ${Object.keys(res.data).join(', ')}`);
        } else {
            console.log(`Data (string): ${String(res.data).substring(0, 100)}`);
        }
    } catch(e) {
        console.log(`FAILED: ${e.response?.status || e.message}`);
    }
}
