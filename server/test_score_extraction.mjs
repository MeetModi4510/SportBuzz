import axios from 'axios';

function extractJsonObjects(dataStr, key) {
    const results = [];
    const regex = new RegExp(`"${key}"\\s*:\\s*({.*?"matchId"\\s*:\\s*\\d+.*?})`, 'g');
    let match;
    while ((match = regex.exec(dataStr)) !== null) {
        try {
            results.push(JSON.parse(match[1]));
        } catch (e) {
            // keep searching but try to find the matching brace manually
            let braceCount = 0;
            let startIndex = match.index + `"${key}":`.length;
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
        }
    }
    return results;
}

axios.get('https://www.cricbuzz.com/cricket-match/live-scores', { headers: { 'User-Agent': 'Mozilla/5.0' } })
    .then(res => {
        let dataStr = typeof res.data === 'string' ? res.data : JSON.stringify(res.data);
        dataStr = dataStr.replace(/\\"/g, '"');
        const matchScores = extractJsonObjects(dataStr, 'matchScore');
        console.log("Total matchScores:", matchScores.length);
        if (matchScores.length > 0) {
            console.log(JSON.stringify(matchScores[0], null, 2));
        } else {
            console.log("No matchScores found!");
        }
    });
