import axios from 'axios';

async function testRscHack(url, typeName) {
    console.log(`\n=== TESTING RSC API HACK FOR ${typeName.toUpperCase()} MATCHES ===`);
    try {
        const res = await axios.get(url, {
            headers: { 
                'User-Agent': 'Mozilla/5.0',
                'RSC': '1',
                'x-nextjs-data': '1'
            }
        });
        
        const dataStr = typeof res.data === 'string' ? res.data : JSON.stringify(res.data);
        
        const match = dataStr.match(/typeMatches\\":(\[\{\\"matchType\\":.*?\}\])\}\\n/);
        
        if (match) {
            let jsonStr = match[1].replace(/\\"/g, '"');
            const parsed = JSON.parse(jsonStr);
            console.log(`Successfully parsed pure JSON! Found ${parsed.length} categories.`);
            
            let count = 0;
            parsed.forEach(category => {
                if (category.seriesMatches) {
                    category.seriesMatches.forEach(series => {
                        if (series.seriesAdWrapper && series.seriesAdWrapper.matches) {
                            series.seriesAdWrapper.matches.forEach(m => {
                                count++;
                                if (count <= 3) {
                                    const info = m.matchInfo || {};
                                    console.log(`- ${info.team1?.teamName} vs ${info.team2?.teamName} | Status: ${info.status}`);
                                }
                            });
                        }
                    });
                }
            });
            console.log(`Total Extracted: ${count} matches`);
        } else {
            console.log("typeMatches not found in RSC payload. Using direct string indexOf test...");
            const idx = dataStr.indexOf('"matchInfo":{"matchId"');
            if (idx > -1) {
                console.log("Found match objects inside payload!");
                console.log(dataStr.substring(idx, idx + 200));
            } else {
                console.log("No match objects found at all.");
            }
        }
        
    } catch(e) {
        console.log(`Failed to fetch ${typeName}:`, e.message);
    }
}

async function runTests() {
    await testRscHack('https://www.cricbuzz.com/cricket-match/live-scores/recent-matches', 'Recent');
    await testRscHack('https://www.cricbuzz.com/cricket-match/live-scores/upcoming-matches', 'Upcoming');
}

runTests();
