const axios = require('axios');
axios.get('https://www.cricbuzz.com/live-cricket-graphs/148415/match').then(res => {
    let html = res.data;
    html = html.replace(/\\"/g, '"');
    const startIdx = html.indexOf('"winProbabilityChartData":');
    if (startIdx === -1) {
        console.log("Not found");
        return;
    }
    const sub = html.substring(startIdx + 26);
    let braceCount = 0;
    let endIdx = 0;
    for (let i = 0; i < sub.length; i++) {
        if (sub[i] === '{') braceCount++;
        else if (sub[i] === '}') {
            braceCount--;
            if (braceCount === 0) {
                endIdx = i + 1;
                break;
            }
        }
    }
    const jsonStr = sub.substring(0, endIdx);
    const data = JSON.parse(jsonStr);
    console.log("Parsed keys:", Object.keys(data));
    const arr = data["1"] || Object.values(data)[0];
    console.log("Length:", arr.length);
    console.log("Sample:", arr.slice(0, 3));
});
