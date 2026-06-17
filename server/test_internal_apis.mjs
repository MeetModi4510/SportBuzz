import axios from 'axios';

async function testInternalApis() {
    const urls = [
        'https://www.cricbuzz.com/api/cricket-match/live-scores',
        'https://www.cricbuzz.com/api/cricket-match/recent-matches',
        'https://m.cricbuzz.com/api/matches/live',
        'https://m.cricbuzz.com/api/matches/recent'
    ];

    for (const url of urls) {
        try {
            console.log(`\nTesting ${url}`);
            const res = await axios.get(url, {
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
            });
            console.log("Success! Status:", res.status);
            console.log("Data:", typeof res.data === 'string' ? res.data.substring(0, 100) : Object.keys(res.data));
        } catch(e) {
            console.log("Failed:", e.message);
        }
    }
}
testInternalApis();
