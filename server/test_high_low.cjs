const axios = require('axios');
const cheerio = require('cheerio');
const highestUrl = 'https://stats.espncricinfo.com/ci/engine/stats/index.html?class=1;ground=61;template=results;type=team;view=results;orderby=team_score';
const lowestUrl = 'https://stats.espncricinfo.com/ci/engine/stats/index.html?class=1;ground=61;template=results;type=team;view=results;orderby=team_score;orderbyad=reverse';

async function test() {
    try {
        const r1 = await axios.get(highestUrl, {headers: {'User-Agent': 'Mozilla/5.0'}});
        const $1 = cheerio.load(r1.data);
        const table1 = $1('table.engineTable').eq(2);
        const hCols = table1.find('tr.data1').first().find('td').map((_, td) => $1(td).text().trim()).get();
        console.log('Highest:', hCols);

        const r2 = await axios.get(lowestUrl, {headers: {'User-Agent': 'Mozilla/5.0'}});
        const $2 = cheerio.load(r2.data);
        const table2 = $2('table.engineTable').eq(2);
        const lCols = table2.find('tr.data1').first().find('td').map((_, td) => $2(td).text().trim()).get();
        console.log('Lowest:', lCols);
    } catch (e) {
        console.error(e);
    }
}
test();
