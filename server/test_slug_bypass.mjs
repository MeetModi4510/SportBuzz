import axios from 'axios';

async function testMatchDetailsSlugBypass() {
    // Notice how we use a fake slug "dummy-slug" instead of the long one
    const url = `https://www.cricbuzz.com/live-cricket-scores/148404/dummy-slug`;
    
    console.log(`\n=== TESTING MATCH DETAILS SLUG BYPASS ===`);
    try {
        const res = await axios.get(url, {
            headers: { 
                'User-Agent': 'Mozilla/5.0',
                'RSC': '1',
                'x-nextjs-data': '1'
            }
        });
        
        const dataStr = typeof res.data === 'string' ? res.data : JSON.stringify(res.data);
        console.log(`Fetched payload length: ${dataStr.length}`);
        
        if (dataStr.includes('matchScoreDetails')) {
            console.log("SUCCESS! Slug bypassed perfectly. Server only cares about the matchId!");
        } else {
            console.log("Failed. Server rejected the fake slug.");
        }
        
    } catch(e) {
        // Axios throws an error if it hits a 301 redirect or 404
        console.log("Failed:", e.message);
    }
}

testMatchDetailsSlugBypass();
