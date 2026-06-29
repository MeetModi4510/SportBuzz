const axios = require('axios');
const cheerio = require('cheerio');
const url = 'https://stats.espncricinfo.com/ci/engine/stats/index.html?class=2;ground=61;template=results;type=team;view=results';

async function test() {
    try {
        const r1 = await axios.get(url, {headers: {'User-Agent': 'Mozilla/5.0'}});
        const $ = cheerio.load(r1.data);
        const table = $('table.engineTable').eq(2);
        
        table.find('tr.data1').slice(0, 5).each((_, row) => {
            const cols = $(row).find('td').map((_, td) => $(td).text().trim()).get();
            console.log(cols);
        });
    } catch (e) {
        console.error(e);
    }
}
test();
