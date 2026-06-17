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

async function testEndpoint(url, typeName) {
    console.log(`\n=== TESTING ${typeName.toUpperCase()} MATCHES ===`);
    console.log(`Fetching from: ${url}`);
    try {
        const res = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        
        const cleanHtml = res.data.replace(/\\"/g, '"');
        const infoIndices = [];
        let searchIdx = 0;
        while(true) {
            const idx = cleanHtml.indexOf('"matchInfo":{', searchIdx);
            if(idx === -1) break;
            infoIndices.push(idx);
            searchIdx = idx + 1;
        }
        
        const matches = [];
        
        for (let i = 0; i < infoIndices.length; i++) {
            const idx = infoIndices[i];
            const endIdx = i < infoIndices.length - 1 ? infoIndices[i+1] : idx + 3000;
            const context = cleanHtml.substring(idx, endIdx);
            
            try {
                const infoStrMatch = context.match(/"matchInfo":(\{.*?"venueInfo":\{.*?\}\})/);
                if (!infoStrMatch) continue;
                const info = JSON.parse(infoStrMatch[1]);
                
                // For recent matches, we have matchScore.
                // For upcoming matches, we usually don't have matchScore, but we have dates.
                let score = undefined;
                const scoreStrMatch = context.match(/"matchScore":(\{.*?\})/);
                if (scoreStrMatch) {
                    try {
                        let scoreStr = scoreStrMatch[1];
                        score = JSON.parse(scoreStr + "}}}"); 
                    } catch(e) {}
                }
                
                if (!matches.find(m => m.matchId === info.matchId)) {
                    matches.push({
                        matchId: info.matchId,
                        title: `${info.team1?.teamName} vs ${info.team2?.teamName}`,
                        status: info.status || "Scheduled",
                        scoreFound: !!score
                    });
                }

            } catch(e) {}
        }
        
        console.log(`Successfully extracted ${matches.length} unique ${typeName} matches!`);
        console.log("Sample 3 Matches:");
        matches.slice(0, 3).forEach(m => {
            console.log(`- ${m.title} | Status: ${m.status} | Has Score: ${m.scoreFound}`);
        });

    } catch(e) {
        console.log(`Failed to fetch ${typeName}:`, e.message);
    }
}

async function runTests() {
    await testEndpoint('https://www.cricbuzz.com/cricket-match/live-scores/recent-matches', 'Recent');
    await testEndpoint('https://www.cricbuzz.com/cricket-match/live-scores/upcoming-matches', 'Upcoming');
}

runTests();
