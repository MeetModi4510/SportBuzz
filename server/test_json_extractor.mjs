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
                // Nextjs payload might have escaped quotes, need to handle it carefully
                let jsonStr = str.substring(startObjIdx, endObjIdx + 1);
                jsonStr = jsonStr.replace(/\\"/g, '"'); // unescape
                results.push(JSON.parse(jsonStr));
            } catch(e) {
                // Ignore invalid parses
            }
        }
        searchIdx = idx + 1;
    }
    return results;
}

async function testJsonExtractor() {
    try {
        const res = await axios.get('https://www.cricbuzz.com/cricket-match/live-scores', {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        
        // Remove escaping from the entire HTML string first
        const cleanHtml = res.data.replace(/\\"/g, '"');
        
        const matchInfos = extractJsonObjects(cleanHtml, 'matchInfo');
        const matchScores = extractJsonObjects(cleanHtml, 'matchScore');
        
        console.log(`Found ${matchInfos.length} matchInfos and ${matchScores.length} matchScores!`);
        
        // Try to pair them up if they are close in the string
        const combined = [];
        const infoIndices = [];
        
        let searchIdx = 0;
        while(true) {
            const idx = cleanHtml.indexOf('"matchInfo":{', searchIdx);
            if(idx === -1) break;
            infoIndices.push(idx);
            searchIdx = idx + 1;
        }
        
        let matchesFound = 0;
        for (let i = 0; i < infoIndices.length; i++) {
            const idx = infoIndices[i];
            const endIdx = i < infoIndices.length - 1 ? infoIndices[i+1] : idx + 2000;
            
            const context = cleanHtml.substring(idx, endIdx);
            const scoreMatch = context.match(/"matchScore":(\{.*?\})/);
            
            if (scoreMatch) {
                try {
                    const infoObj = JSON.parse(context.substring(context.indexOf('{'), context.indexOf('}', context.indexOf('"venueInfo"')) + 50).match(/\{.*?\}/)?.[0] || "{}"); // This is dirty, let's just use the array we built
                } catch(e){}
                matchesFound++;
            }
        }
        
        console.log(`Successfully paired ${matchesFound} matches with scores!`);

    } catch(e) {
        console.log("Failed:", e.message);
    }
}

testJsonExtractor();
