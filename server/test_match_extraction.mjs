import axios from 'axios';

function extractJsonObjects(dataStr, key) {
    const results = [];
    const regex = new RegExp(`"${key}"\\s*:\\s*({.*?"matchId"\\s*:\\s*\\d+.*?})`, 'g');
    // We'll just look for {"matchInfo":..., "matchScore":...}
    const matchRegex = /"match"\s*:\s*(\{.*?"matchInfo".*?"matchScore".*?\})/g;
    
    let match;
    while ((match = matchRegex.exec(dataStr)) !== null) {
        try {
            // Find end of the object
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
        console.log("Total match objects:", matches.length);
        if (matches.length > 0) {
            console.log(JSON.stringify(matches[0].matchScore, null, 2));
        }
    });
