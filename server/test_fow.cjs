const fs = require('fs');
const cheerio = require('cheerio');
const $ = cheerio.load(fs.readFileSync('fow.html', 'utf8'));
const ths = [];
$('table.engineTable').eq(2).find('th').each((i, el) => ths.push($(el).text().trim()));
console.log('Columns:', ths.join(', '));
const firstRowTds = [];
$('table.engineTable').eq(2).find('tr.data1').first().find('td').each((i, el) => firstRowTds.push($(el).text().trim()));
console.log('Row0:', firstRowTds.join(' | '));
