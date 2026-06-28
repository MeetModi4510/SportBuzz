const axios = require('axios');
const cheerio = require('cheerio');
async function run() {
    const {data} = await axios.get('https://stats.espncricinfo.com/ci/engine/stats/index.html?class=1;ground=57980;template=results;type=team;view=innings', {headers: {'User-Agent': 'Mozilla/5.0'}});
    const $ = cheerio.load(data);
    const row = $('table.engineTable').eq(2).find('tr.data1').first();
    console.log(row.text().replace(/\s+/g, ' '));
}
run();
