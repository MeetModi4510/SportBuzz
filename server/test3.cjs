const fs = require('fs');
const cheerio = require('cheerio');
const h2hHtml = fs.readFileSync('h2h.html', 'utf8');
const $ = cheerio.load(h2hHtml);
console.log($('table.engineTable').length);
const ths = [];
$('table.engineTable').first().find('th').each((i, el) => ths.push($(el).text()));
console.log(ths);
