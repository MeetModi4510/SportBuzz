import axios from 'axios';

async function testMatchScrapingNextJs() {
    try {
        const res = await axios.get('https://www.cricbuzz.com/cricket-match/live-scores', {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        
        const html = res.data;
        
        // Find where "typeMatches" or "matches" exists in the Next.js payload
        const match = html.match(/"typeMatches":(\[.*?\}\]\})/);
        if (match) {
            console.log("Found typeMatches in JSON payload!");
            try {
                // Since regex extraction of JSON can be messy, let's just log the raw substring
                console.log(match[0].substring(0, 500));
            } catch(e) {
                console.log("JSON parse error:", e.message);
            }
        } else {
            console.log("No typeMatches found. Looking for other JSON chunks...");
            const chunks = html.match(/\{[^}]*"matchId":\d+[^}]*\}/g);
            if (chunks) {
                console.log(`Found ${chunks.length} match objects in JSON.`);
                console.log("Sample:", chunks[0]);
            }
        }

    } catch(e) {
        console.error(`Error:`, e.message);
    }
}

testMatchScrapingNextJs();
