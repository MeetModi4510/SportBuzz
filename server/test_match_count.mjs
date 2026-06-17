import axios from 'axios';

async function countMatches(url, typeName) {
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
            
            let totalMatches = 0;
            let seriesCount = 0;
            
            parsed.forEach(category => {
                if (category.seriesMatches) {
                    category.seriesMatches.forEach(series => {
                        seriesCount++;
                        if (series.seriesAdWrapper && series.seriesAdWrapper.matches) {
                            totalMatches += series.seriesAdWrapper.matches.length;
                        }
                    });
                }
            });
            
            console.log(`[${typeName}] Successfully extracted ${totalMatches} matches across ${seriesCount} different series/tournaments!`);
        } else {
            console.log(`[${typeName}] Failed to extract matches.`);
        }
        
    } catch(e) {
        console.log(`Error:`, e.message);
    }
}

async function run() {
    await countMatches('https://www.cricbuzz.com/cricket-match/live-scores/recent-matches', 'RECENT');
    await countMatches('https://www.cricbuzz.com/cricket-match/live-scores/upcoming-matches', 'UPCOMING');
}
run();
