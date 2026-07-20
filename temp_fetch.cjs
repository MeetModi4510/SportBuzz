const fs = require('fs');

async function run() {
    try {
        const response = await fetch('https://www.cricbuzz.com/live-cricket-graphs/129458/match');
        const text = await response.text();
        
        let html = text.replace(/\\"/g, '"');
        const startIdx = html.indexOf('"runsPerOverChartData":');
        
        const sub = html.substring(startIdx + 23);
        let braceCount = 0;
        let endIdx = 0;
        
        for (let i = 0; i < sub.length; i++) {
            if (sub[i] === '{' || sub[i] === '[') braceCount++;
            else if (sub[i] === '}' || sub[i] === ']') {
                braceCount--;
                if (braceCount === 0) {
                    endIdx = i + 1;
                    break;
                }
            }
        }

        const jsonStr = sub.substring(0, endIdx);
        const data = JSON.parse(jsonStr);
        let arr = Array.isArray(data) ? data : data[Object.keys(data)[0]];
        
        console.log("Overs 40 to 49 Wickets:");
        for(let i=39; i<=48; i++) {
            const item = arr.find(x => Math.floor(x.over) === i || x.over === i);
            if(item) {
                console.log(`Over ${item.over}: T1(wkts=${item.isTeam1Wicket}, len=${item.team1WicketCommentary?.length||0}), T2(wkts=${item.isTeam2Wicket}, len=${item.team2WicketCommentary?.length||0})`);
            }
        }
    } catch (e) {
        console.error(e);
    }
}
run();
