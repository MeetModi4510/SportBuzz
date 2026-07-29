import axios from 'axios';

async function testTimestampPagination() {
    const matchId = 129480; // A recent test match
    
    // Potential old endpoints:
    const endpointsToTest = [
        `https://www.cricbuzz.com/api/cricket-match/commentary/${matchId}`,
        `https://www.cricbuzz.com/match-api/${matchId}/commentary.json`,
        `https://m.cricbuzz.com/api/cricket-match/commentary/${matchId}`,
        `https://www.cricbuzz.com/api/cricket/match/commentary/${matchId}`
    ];

    for (let url of endpointsToTest) {
        console.log(`\nTesting: ${url}`);
        try {
            const res = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'application/json'
                }
            });
            console.log(`Status: ${res.status}`);
            console.log(`Content-Type: ${res.headers['content-type']}`);
            if (res.data) {
                if (typeof res.data === 'string') {
                    console.log(`Data (string): ${res.data.substring(0, 150)}...`);
                } else {
                    console.log(`Data (JSON keys):`, Object.keys(res.data));
                }
            }
        } catch(e) {
            console.log(`Failed: ${e.message}`);
            if (e.response && e.response.status === 404) {
                 console.log(`404 Not Found`);
            }
        }
    }
}

testTimestampPagination();
