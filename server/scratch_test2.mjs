import * as cheerio from 'cheerio';
fetch('https://stats.espncricinfo.com/ci/engine/stats/index.html?class=1;filter=advanced;ground=292;orderby=start;orderbyad=reverse;template=results;type=team;view=results')
.then(res => res.text())
.then(html => {
    const $ = cheerio.load(html);
    const table = $('table.engineTable').eq(2);
    const headers = table.find('tr.headlinks th').map((_, th) => $(th).text().trim()).get();
    console.log('HEADERS:', headers);
    const firstRow = table.find('tr.data1').first().find('td').map((_, td) => $(td).text().trim()).get();
    console.log('FIRST ROW:', firstRow);
});
