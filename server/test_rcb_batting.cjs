const fs = require('fs');
const cheerio = require('cheerio');
fetch('https://stats.espncricinfo.com/ci/engine/stats/index.html?class=6;team=4340;template=results;type=batting').then(r=>r.text()).then(html => {
    const $ = cheerio.load(html);
    const tds = $('table.engineTable').eq(2).find('tr.data1').first().find('td');
    for(let i=0; i<tds.length; i++) console.log('td'+i, $(tds[i]).text().trim());
});
