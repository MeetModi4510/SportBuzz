const axios = require('axios');

axios.get('https://www.cricbuzz.com/live-cricket-graphs/118864/match', { headers: { 'User-Agent': 'Mozilla/5.0' } })
.then(res => {
    let html = res.data.replace(/\\"/g, '"');
    const startIdx = html.indexOf('"winProbabilityChartData":');
    if (startIdx === -1) return console.log('no data');
    const sub = html.substring(startIdx + 26);
    let braceCount = 0; let endIdx = 0;
    for (let i = 0; i < sub.length; i++) {
        if (sub[i] === '{') braceCount++;
        else if (sub[i] === '}') { braceCount--; if (braceCount === 0) { endIdx = i + 1; break; } }
    }
    const data = JSON.parse(sub.substring(0, endIdx));
    console.log(JSON.stringify(data['1'].slice(0, 2), null, 2));
    if (data['2']) {
        console.log(JSON.stringify(data['2'].slice(0, 2), null, 2));
    }
}).catch(console.error);
