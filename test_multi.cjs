const axios = require('axios');
axios.get('https://www.cricbuzz.com/live-cricket-graphs/129563/match').then(res => {
    let html = res.data.replace(/\\"/g, '"');
    const startIdx = html.indexOf('"winProbabilityChartData":');
    if (startIdx === -1) return console.log('no data');
    const sub = html.substring(startIdx + 26);
    let braceCount = 0; let endIdx = 0;
    for (let i = 0; i < sub.    length; i++) {
        if (sub[i] === '{') braceCount++;
        else if (sub[i] === '}') {
            braceCount--;
            if (braceCount === 0) { endIdx = i + 1; break; }
        }
    }
    const data = JSON.parse(sub.substring(0, endIdx));
    console.log('Inn 1 last:', data['1'][data['1'].length-1]);
    console.log('Inn 2 first:', data['2'][0]);
});
