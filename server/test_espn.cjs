const axios = require('axios');
const cheerio = require('cheerio');
axios.get('https://stats.espncricinfo.com/ci/engine/stats/index.html?class=1;ground=61;template=results;type=aggregate;innings_number=2', {headers: {'User-Agent': 'Mozilla/5.0'}}).then(r => {
    const $ = cheerio.load(r.data);
    const agg2 = $('table.engineTable').eq(2).find('tr.data1').first().find('td').map((_, el) => $(el).text().trim()).get();
    console.log('agg2:', agg2);
}).catch(console.error);
