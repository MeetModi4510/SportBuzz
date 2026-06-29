const axios = require('axios');
const cheerio = require('cheerio');
axios.get('https://stats.espncricinfo.com/ci/engine/stats/index.html?class=1;ground=61;template=results;type=team;view=innings;innings_number=1;groupby=year', {headers: {'User-Agent': 'Mozilla/5.0'}}).then(r => {
    const $ = cheerio.load(r.data);
    const table_el = $('table.engineTable').eq(2);
    console.log('table exists:', table_el.length);
    const rows = [];
    table_el.find('tr.data1').slice(0, 5).each((_, row) => {
        const c = $(row).find('td').map((_, td) => $(td).text().trim()).get();
        rows.push(c);
    });
    console.log(rows);
}).catch(console.error);
