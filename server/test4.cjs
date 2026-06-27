const fs = require('fs');
const cheerio = require('cheerio');
const h2hHtml = fs.readFileSync('h2h.html', 'utf8');
const $ = cheerio.load(h2hHtml);
$('table.engineTable').each((i, el) => {
    const ths = [];
    $(el).find('th, .headLinks').each((j, th) => ths.push($(th).text().trim()));
    console.log(`Table ${i}:`, ths.join(', '));
});
