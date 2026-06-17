import axios from 'axios';

function extractJsonObjects(dataStr, key) {
    const results = [];
    const matchRegex = /"match"\s*:\s*(\{.*?"matchInfo".*?"matchScore".*?\})/g;
    
    let match;
    while ((match = matchRegex.exec(dataStr)) !== null) {
        try {
            let braceCount = 0;
            let startIndex = match.index + `"match":`.length;
            while(dataStr[startIndex] !== '{' && startIndex < dataStr.length) startIndex++;
            
            if (startIndex < dataStr.length) {
                let i = startIndex;
                for (; i < dataStr.length; i++) {
                    if (dataStr[i] === '{') braceCount++;
                    if (dataStr[i] === '}') braceCount--;
                    if (braceCount === 0) {
                        try {
                            results.push(JSON.parse(dataStr.substring(startIndex, i + 1)));
                        } catch (err) {}
                        break;
                    }
                }
            }
        } catch (e) {}
    }
    return results;
}

axios.get('https://www.cricbuzz.com/cricket-match/live-scores', { headers: { 'User-Agent': 'Mozilla/5.0' } })
    .then(res => {
        let dataStr = typeof res.data === 'string' ? res.data : JSON.stringify(res.data);
        dataStr = dataStr.replace(/\\"/g, '"');
        const matches = extractJsonObjects(dataStr, 'match');
        
        matches.forEach(m => {
            const team1 = m.matchInfo.team1?.teamName;
            if (team1 && team1.includes('Malwa')) {
                console.log("Found Malwa Stallions in the 18 matches!");
                console.log(m.matchInfo.state);
            }
        });
    });
