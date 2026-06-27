const fs = require('fs');
const cheerio = require('cheerio');
const h2hHtml = fs.readFileSync('h2h.html', 'utf8');
const $h = cheerio.load(h2hHtml);
const h2hRows = [];
$h('table.engineTable').eq(2).find('tr.data1').each((i, el) => {
    const tds = $h(el).find('td');
    h2hRows.push({
        opp: $h(tds[0]).text().trim(),
        mat: $h(tds[2]).text().trim(),
        won: $h(tds[3]).text().trim(),
        lost: $h(tds[4]).text().trim(),
        tied: $h(tds[5]).text().trim(),
        nr: $h(tds[6]).text().trim()
    });
});
console.log('H2H:', h2hRows.slice(0, 5));
