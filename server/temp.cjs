const fs = require('fs');
const cheerio = require('cheerio');
const html = fs.readFileSync('fielding.html', 'utf8');
const $ = cheerio.load(html);
console.log($('table.engineTable').eq(2).find('tr.data1').eq(0).find('td').eq(0).html());
