const axios = require('axios');

function extractJsonObjects(htmlStr, key) {
    const results = [];
    const keyRegex = new RegExp(`"${key}"\\s*:\\s*`, 'g');
    let match;
    while ((match = keyRegex.exec(htmlStr)) !== null) {
        let startIndex = match.index + match[0].length;
        let openBraces = 0, openBrackets = 0, isString = false, isEscaped = false, endIndex = -1;
        const char = htmlStr[startIndex];
        if (char !== '{' && char !== '[') continue;
        for (let i = startIndex; i < htmlStr.length; i++) {
            const c = htmlStr[i];
            if (isEscaped) { isEscaped = false; continue; }
            if (c === '\\') { isEscaped = true; continue; }
            if (c === '"') { isString = !isString; continue; }
            if (!isString) {
                if (c === '{') openBraces++;
                else if (c === '}') openBraces--;
                else if (c === '[') openBrackets++;
                else if (c === ']') openBrackets--;
                if (openBraces === 0 && openBrackets === 0) { endIndex = i; break; }
            }
        }
        if (endIndex !== -1) {
            try { results.push(JSON.parse(htmlStr.substring(startIndex, endIndex + 1))); }
            catch (e) {}
        }
    }
    return results;
}

async function testInnings(inningsId) {
    const url = `https://www.cricbuzz.com/live-cricket-full-commentary/129563/match/${inningsId}`;
    const res = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0', 'RSC': '1', 'x-nextjs-data': '1' } });
    const comms = extractJsonObjects(res.data, 'commentaryList');
    if (comms.length > 0) {
        console.log(`Innings ${inningsId} commentary items:`, comms[0].length);
        console.log(`First item timestamp:`, comms[0][0].timestamp);
    }
}
testInnings(1).then(() => testInnings(2)).catch(console.error);
