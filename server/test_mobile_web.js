import axios from 'axios';

async function testMobileWeb() {
    const matchId = 129480; 
    
    // Testing the mobile web endpoint
    const url = `https://m.cricbuzz.com/cricket-commentary/${matchId}/match`;
    // also try m.cricbuzz.com/live-cricket-full-commentary/...

    console.log(`\nTesting Mobile Web Spoof on: ${url}`);
    try {
        const response = await axios.get(url, {
            headers: {
                // iPhone Safari User-Agent
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
            }
        });
        
        console.log(`Status: ${response.status}`);
        const html = response.data;
        
        // Check if it looks like Next.js or old school HTML
        if (html.includes('__NEXT_DATA__') || html.includes('_next/static')) {
            console.log("Result: m.cricbuzz.com is ALSO using Next.js! It is the same modern architecture.");
        } else {
            console.log("Result: Found an old-school HTML site!");
            // Check for pagination links
            const loadMoreRegex = /href="([^"]+)">Load More/i;
            const match = html.match(loadMoreRegex);
            if (match) {
                 console.log("Found a pagination link! " + match[1]);
            } else {
                 console.log("No Load More link found in HTML.");
            }
        }
        
    } catch (err) {
        console.error("Mobile web blocked or failed:", err.response ? err.response.status : err.message);
    }
}

testMobileWeb();
