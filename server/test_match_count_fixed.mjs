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
        
        // Find "typeMatches":[ and extract the array
        const startIdx = dataStr.indexOf('"typeMatches":[');
        if (startIdx > -1) {
            let openBraces = 0;
            let endIdx = -1;
            
            // start at the bracket
            const arrayStart = startIdx + '"typeMatches":'.length;
            
            for (let i = arrayStart; i < dataStr.length; i++) {
                if (dataStr[i] === '[') openBraces++;
                if (dataStr[i] === ']') openBraces--;
                
                if (openBraces === 0) {
                    endIdx = i;
                    break;
                }
            }
            
            if (endIdx > -1) {
                let jsonStr = dataStr.substring(arrayStart, endIdx + 1);
                // unescape quotes
                jsonStr = jsonStr.replace(/\\"/g, '"');
                
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
                return;
            }
        }
        
        console.log(`[${typeName}] Failed to extract matches. Length: ${dataStr.length}`);
        
    } catch(e) {
        console.log(`Error:`, e.message);
    }
}

async function run() {
    await countMatches('https://www.cricbuzz.com/cricket-match/live-scores/recent-matches', 'RECENT');
    await countMatches('https://www.cricbuzz.com/cricket-match/live-scores/upcoming-matches', 'UPCOMING');
}
run();
