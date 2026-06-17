import axios from 'axios';

async function testLiveScoresRsc() {
    try {
        console.log("=== TESTING LIVE SCORES WITH RSC HACK ===");
        const res = await axios.get('https://www.cricbuzz.com/cricket-match/live-scores', {
            headers: { 
                'User-Agent': 'Mozilla/5.0',
                'RSC': '1',
                'x-nextjs-data': '1'
            }
        });
        
        const dataStr = typeof res.data === 'string' ? res.data : JSON.stringify(res.data);
        
        // Extract the typeMatches array
        const match = dataStr.match(/typeMatches\\":(\[\{\\"matchType\\":.*?\}\])\}\\n/);
        if (match) {
            console.log("Successfully extracted raw typeMatches string!");
            // Clean up the escaped quotes and parse it
            try {
                let jsonStr = match[1].replace(/\\"/g, '"');
                const parsed = JSON.parse(jsonStr);
                
                console.log(`Found ${parsed.length} match categories.`);
                
                let totalMatches = 0;
                parsed.forEach(category => {
                    console.log(`\n-- Category: ${category.matchType} --`);
                    if (category.seriesMatches) {
                        category.seriesMatches.forEach(series => {
                            if (series.seriesAdWrapper && series.seriesAdWrapper.matches) {
                                series.seriesAdWrapper.matches.forEach(m => {
                                    totalMatches++;
                                    const info = m.matchInfo || {};
                                    const score = m.matchScore || {};
                                    console.log(`Match ID: ${info.matchId}`);
                                    console.log(`Series: ${info.seriesName}`);
                                    console.log(`Status: ${info.status}`);
                                    if (info.team1 && info.team2) {
                                        console.log(`Teams: ${info.team1.teamName} vs ${info.team2.teamName}`);
                                    }
                                });
                            }
                        });
                    }
                });
                console.log(`\nTotal Live Matches Extracted: ${totalMatches}`);
                
            } catch(e) {
                console.log("Error parsing JSON:", e.message);
                console.log("Raw match:", match[1].substring(0, 300));
            }
        } else {
            console.log("Could not find typeMatches in the payload.");
            console.log("Raw payload snippet:", dataStr.substring(0, 500));
        }

    } catch(e) {
        console.log("Failed:", e.message);
    }
}

testLiveScoresRsc();
