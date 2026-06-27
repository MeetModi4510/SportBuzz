const fs = require('fs');
const cheerio = require('cheerio');
const h2hHtml = fs.readFileSync('h2h.html', 'utf8');
const $ = cheerio.load(h2hHtml);
console.log($('table.engineTable').eq(2).text().substring(0, 1000).replace(/\s+/g, ' '));
