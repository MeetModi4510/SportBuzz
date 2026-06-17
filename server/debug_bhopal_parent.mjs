import axios from 'axios';

function extractMatchObjects(str) {
    const results = [];
    let searchIdx = 0;
    while (true) {
        const idx = str.indexOf('"matchInfo"', searchIdx);
        if (idx === -1) break;
        
        let startObjIdx = str.lastIndexOf('{', idx);
        if (startObjIdx !== -1) {
            let openBraces = 0;
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
                    let parsed = JSON.parse(jsonStr);
                    if (parsed && parsed.matchInfo) {
                        results.push(parsed);
                    }
                } catch(e) {}
            }
        }
        searchIdx = idx + '"matchInfo"'.length;
    }
    return results;
}

axios.get('https://www.cricbuzz.com/cricket-match/live-scores', {headers:{'User-Agent':'Mozilla/5.0', 'RSC': '1'}})
    .then(res => {
        let dataStr = typeof res.data === 'string' ? res.data : JSON.stringify(res.data);
        dataStr = dataStr.replace(/\\"/g, '"');
        const matches = extractMatchObjects(dataStr);
        console.log("Total unique matches:", new Set(matches.map(m => m.matchInfo.matchId)).size);
        const bhopalMatch = matches.find(m => m.matchInfo.team1?.teamName?.includes('Bhopal') || m.matchInfo.team2?.teamName?.includes('Bhopal'));
        if (bhopalMatch) {
            console.log("Found Bhopal! Score:", JSON.stringify(bhopalMatch.matchScore));
        } else {
            console.log("Not found.");
        }
    });
