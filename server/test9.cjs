const fs = require('fs');
const cheerio = require('cheerio');
const h2hHtml = fs.readFileSync('h2h.html', 'utf8');
const $ = cheerio.load(h2hHtml);
$('table.engineTable').eq(2).find('tr').slice(0,3).each((i, el) => {
    console.log('Row Class:', $(el).attr('class'));
    const tds = $(el).find('td');
    for(let j=0; j<tds.length; j++) console.log(j, $(tds[j]).text().trim());
});
