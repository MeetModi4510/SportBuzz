const axios = require('axios');
const cheerio = require('cheerio');

async function test(url) {
    try {
        const r1 = await axios.get(url, {headers: {'User-Agent': 'Mozilla/5.0'}});
        const $1 = cheerio.load(r1.data);
        const table1 = $1('table.engineTable').eq(2);
        const headers = table1.find('tr.headlinks').first().find('th').map((_, th) => $1(th).text().trim()).get();
        console.log(headers);
    } catch (e) {
        console.error(e);
    }
}
test('https://stats.espncricinfo.com/ci/engine/stats/index.html?class=1;ground=61;template=results;type=team;view=results');
test('https://stats.espncricinfo.com/ci/engine/stats/index.html?class=2;ground=61;template=results;type=team;view=results');
