const axios = require('axios');
axios.get('https://www.cricbuzz.com/live-cricket-graphs/129458/match', {headers: {'User-Agent': 'Mozilla/5.0'}})
.then(res => {
    const html = res.data.replace(/\\"/g, '"');
    const dataIndex = html.indexOf('"overGraphData"');
    console.log('overGraphData index:', dataIndex);
    if (dataIndex !== -1) {
        const sub = html.substring(dataIndex, dataIndex + 2000);
        console.log('Data:', sub);
    }
}).catch(console.error);
