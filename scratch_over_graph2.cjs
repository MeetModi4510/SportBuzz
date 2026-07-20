const axios = require('axios');
axios.get('https://www.cricbuzz.com/live-cricket-graphs/129458/eng-vs-ind-1st-odi-india-tour-of-england-2026?graph=overs', {headers: {'User-Agent': 'Mozilla/5.0'}})
.then(res => {
    let html = res.data.replace(/\\"/g, '"');
    const overIdx = html.indexOf('"overGraphData"');
    console.log('overGraphData:', overIdx);
    
    const runsIdx = html.indexOf('"runs"');
    console.log('runs:', runsIdx);
    
    // Look for anything containing "overs" and "runs" in the same block
    const matches = html.match(/\{[^}]*"runs"[^}]*"overs"[^}]*\}/g);
    if (matches) {
        console.log('Found block with runs and overs:', matches[0].substring(0, 500));
    }
    
    const chartDataMatches = html.match(/"chartData":(\[.*?\])/);
    if (chartDataMatches) {
        console.log('Found chartData:', chartDataMatches[1].substring(0, 500));
    }
    
    const anyArrayMatches = html.match(/"[^"]*":(\[\{"over":.*?\}\])/);
    if (anyArrayMatches) {
        console.log('Found array with over objects:', anyArrayMatches[0].substring(0, 500));
    }

}).catch(console.error);
