import axios from 'axios';

const MATCH_ID = '129563';

// Try the /api/html/ endpoint which returned 200
const endpoints = [
    { url: `https://www.cricbuzz.com/api/html/cricket-commentary/${MATCH_ID}`, desc: 'cricket-commentary' },
    { url: `https://www.cricbuzz.com/api/html/live-cricket-full-commentary/${MATCH_ID}`, desc: 'live-full-commentary' },
    { url: `https://api.cricbuzz.com/api/v1/matches/${MATCH_ID}/commentary`, desc: 'api.cricbuzz.com/v1' },
    { url: `https://www.cricbuzz.com/api/v1/matches/${MATCH_ID}/commentary/0`, desc: 'v1 commentary page 0' },
];

const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'application/json, text/html, */*',
    'Referer': 'https://www.cricbuzz.com/',
};

for (const { url, desc } of endpoints) {
    try {
        console.log(`\nTrying [${desc}]:`, url.substring(0, 80));
        const r = await axios.get(url, { headers: HEADERS, timeout: 8000 });
        console.log('  Status:', r.status);
        const data = r.data;
        const preview = typeof data === 'object' ? JSON.stringify(data).substring(0, 500) : String(data).substring(0, 500);
        console.log('  Preview:', preview || '(empty)');
    } catch(e) {
        console.log('  FAIL:', e.response?.status || e.message);
    }
}
