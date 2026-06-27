const fs = require('fs');
const cheerio = require('cheerio');
const $ = cheerio.load(fs.readFileSync('fow.html', 'utf8'));
$('table.engineTable').eq(2).find('tr.data1').slice(0, 5).each((i, el) => {
    const tds = $(el).find('td');
    console.log('Row '+i+':', $(tds[0]).text().trim(), '100s:', parseInt($(tds[7]).text()) || 0, '50s:', parseInt($(tds[8]).text()) || 0, 'Runs:', parseInt($(tds[4]).text()) || 0);
});
