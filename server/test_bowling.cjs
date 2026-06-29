const axios = require('axios');
const cheerio = require('cheerio');
const bowlingUrl = 'https://stats.espncricinfo.com/ci/engine/stats/index.html?class=1;ground=61;template=results;type=bowling';

async function test() {
    try {
        const r1 = await axios.get(bowlingUrl, {headers: {'User-Agent': 'Mozilla/5.0'}});
        const $1 = cheerio.load(r1.data);
        const table1 = $1('table.engineTable').eq(2);
        
        console.log("Headers:");
        const headers = table1.find('tr.headlinks').first().find('th').map((_, th) => $1(th).text().trim()).get();
        console.log(headers);

        console.log("First Row:");
        const row = table1.find('tr.data1').first().find('td').map((_, td) => $1(td).text().trim()).get();
        console.log(row);
    } catch (e) {
        console.error(e);
    }
}
test();
