const fs = require('fs');
const cheerio = require('cheerio');
const h2hHtml = fs.readFileSync('h2h.html', 'utf8');
const $ = cheerio.load(h2hHtml);
$('table.engineTable').eq(2).find('tr.data1').slice(0,1).each((i, el) => {
    const tds = $(el).find('td');
    console.log('td count:', tds.length);
    for(let j=0; j<tds.length; j++) console.log(j, $(tds[j]).text().trim());
});
