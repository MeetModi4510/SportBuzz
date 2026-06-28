const cheerio = require('cheerio');
const fs = require('fs');
const html = fs.readFileSync('stealth_eden.html', 'utf8');
const $ = cheerio.load(html);
const rows = $('table.engineTable').eq(2).find('tr.data1');
console.log('Rows count:', rows.length);
if (rows.length > 0) {
    console.log('Highest Total row:', $(rows[0]).text().replace(/\s+/g, ' '));
}
