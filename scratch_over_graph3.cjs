const axios = require('axios');
axios.get('https://www.cricbuzz.com/live-cricket-graphs/129458/match', {headers: {'User-Agent': 'Mozilla/5.0'}})
.then(res => {
    let html = res.data.replace(/\\"/g, '"');
    
    // Find all chart data arrays
    const regex = /"([a-zA-Z0-9]+ChartData)"/g;
    let match;
    const uniqueKeys = new Set();
    while ((match = regex.exec(html)) !== null) {
        uniqueKeys.add(match[1]);
    }
    console.log('Chart Data Keys:', Array.from(uniqueKeys));
}).catch(console.error);
