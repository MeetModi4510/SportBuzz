import axios from 'axios';

async function testMobileApiPagination() {
    const matchId = 129480; 
    let lastTimestamp = '';
    let loopCount = 0;

    while (loopCount < 3) { // just test 3 pages
        const url = `https://www.cricbuzz.com/api/cricket-match/commentary/${matchId}${lastTimestamp ? `?lastTimestamp=${lastTimestamp}` : ''}`;
        console.log(`\nFetching: ${url}`);
        
        try {
            const res = await axios.get(url, {
                headers: {
                    // MUST use mobile user-agent to get JSON API response instead of Next.js HTML
                    'User-Agent': 'Mozilla/5.0 (Linux; Android 10; SM-A205U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.6045.66 Mobile Safari/537.36',
                    'Accept': 'application/json'
                }
            });

            if (res.data) {
                console.log(`Response type: ${typeof res.data}`);
                if (typeof res.data === 'object') {
                    console.log(`Keys:`, Object.keys(res.data));
                } else if (typeof res.data === 'string') {
                    console.log(`String preview:`, res.data.substring(0, 150));
                }
            }
        } catch(e) {
            console.error(`Error: ${e.message}`);
            break;
        }
        loopCount++;
    }
}

testMobileApiPagination();
