import https from 'https';
import * as cheerio from 'cheerio';
const url = 'https://stats.espncricinfo.com/ci/engine/stats/index.html?class=11;page=1;template=results;type=aggregate;view=ground';
https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
    let data = '';
    res.on('data', chunk => { data += chunk; });
    res.on('end', () => {
        const $ = cheerio.load(data);
        const firstRow = $('table.engineTable').eq(2).find('tr.data1').eq(0);
        console.log('Row HTML:', firstRow.html());
    });
});
