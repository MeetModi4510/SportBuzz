const fs = require('fs');
const cheerio = require('cheerio');
const h2hHtml = fs.readFileSync('h2h.html', 'utf8');
const $ = cheerio.load(h2hHtml);
const rows = [];
$('table.engineTable').eq(2).find('tr.data1, tr.data2, tr').each((i, el) => {
    const tds = $(el).find('td');
    if (tds.length > 5) {
        rows.push({
            opp: $(tds[0]).text().trim(),
            mat: $(tds[2]).text().trim(),
            won: $(tds[3]).text().trim(),
            lost: $(tds[4]).text().trim(),
            tied: $(tds[5]).text().trim(),
            nr: $(tds[6]).text().trim()
        });
    }
});
console.log('H2H:', rows.slice(0, 5));
