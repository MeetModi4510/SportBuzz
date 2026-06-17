import axios from 'axios';

function extractJsonObjects(str, key) {
    const results = [];
    let searchIdx = 0;
    while (true) {
        const idx = str.indexOf(`"${key}":{`, searchIdx);
        if (idx === -1) break;
        
        let openBraces = 0;
        let startObjIdx = idx + `"${key}":`.length;
        let endObjIdx = -1;
        
        for (let i = startObjIdx; i < str.length; i++) {
            if (str[i] === '{') openBraces++;
            if (str[i] === '}') openBraces--;
            
            if (openBraces === 0) {
                endObjIdx = i;
                break;
            }
        }
        
        if (endObjIdx !== -1) {
            try {
                let jsonStr = str.substring(startObjIdx, endObjIdx + 1);
                jsonStr = jsonStr.replace(/\\"/g, '"'); 
                results.push(JSON.parse(jsonStr));
            } catch(e) {}
        }
        searchIdx = idx + 1;
    }
    return results;
}

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
        const cleanHtml = dataStr.replace(/\\"/g, '"');
        
        const matchInfos = extractJsonObjects(cleanHtml, 'matchInfo');
        
        // Count unique
        const unique = new Set();
        matchInfos.forEach(m => unique.add(m.matchId));
        
        console.log(`[${typeName}] Extracted ${unique.size} UNIQUE matches!`);
        if (matchInfos.length > 0) {
            console.log(`Sample: ${matchInfos[0].team1?.teamName} vs ${matchInfos[0].team2?.teamName}`);
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
