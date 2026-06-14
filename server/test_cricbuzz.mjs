import axios from 'axios';

async function testCricbuzzApi() {
    const endpointsToTest = [
        // Web APIs
        'https://www.cricbuzz.com/api/cricket-match/livematches',
        'https://www.cricbuzz.com/api/cricket-match/recent',
        'https://www.cricbuzz.com/api/match/livematches',
        // Mobile APIs (often less protected)
        'http://mapps.cricbuzz.com/cbzios/match/livematches',
        'http://mapps.cricbuzz.com/cbzios/match/recentmatches',
        // Another variation
        'https://cricbuzz-cricket.p.rapidapi.com/matches/v1/live' // Note: This is rapidAPI, so it will fail without key, but let's test their own origin
    ];

    console.log("Testing Cricbuzz Internal APIs...");

    for (const url of endpointsToTest) {
        if (url.includes('rapidapi')) continue; // Skip rapidapi

        try {
            const res = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
                    'Accept': 'application/json, text/plain, */*'
                },
                timeout: 5000
            });
            console.log(`[SUCCESS] ${url} -> Status: ${res.status}`);
            
            // Print a snippet of the data
            if (res.data) {
                const keys = Object.keys(res.data);
                console.log(`          Data keys: ${keys.join(', ')}`);
                // If it's an array, show length
                if (Array.isArray(res.data)) {
                    console.log(`          Array length: ${res.data.length}`);
                }
            }
        } catch (err) {
            console.log(`[FAILED]  ${url} -> ${err.message}`);
        }
    }
}

testCricbuzzApi();
