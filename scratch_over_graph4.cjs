const axios = require('axios');
axios.get('https://www.cricbuzz.com/live-cricket-graphs/129458/match', {headers: {'User-Agent': 'Mozilla/5.0'}})
.then(res => {
    let html = res.data.replace(/\\"/g, '"');
    const idx = html.indexOf('"runsPerOverChartData":');
    if (idx !== -1) {
        console.log('runsPerOverChartData:', html.substring(idx, idx + 1000));
    }
}).catch(console.error);
