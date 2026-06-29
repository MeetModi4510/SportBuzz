const axios = require('axios');
const cheerio = require('cheerio');
const battingUrl = 'https://stats.espncricinfo.com/ci/engine/stats/index.html?class=2;ground=61;template=results;type=batting';

async function test() {
    try {
        const r1 = await axios.get(battingUrl, {headers: {'User-Agent': 'Mozilla/5.0'}});
        const $1 = cheerio.load(r1.data);
        const table1 = $1('table.engineTable').eq(2);
        
        table1.find('tr.data1').slice(0, 10).each((_, row) => {
            const cols = $1(row).find('td').map((_, td) => $1(td).text().trim()).get();
            console.log(cols[0], "100s:", cols[8]);
        });
    } catch (e) {
        console.error(e);
    }
}
test();
