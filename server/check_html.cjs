const fs = require('fs');
const cheerio = require('cheerio');

const $1 = cheerio.load(fs.readFileSync('espn.html', 'utf8'));
console.log('ESPN Title:', $1('title').text());
const espnTables = $1('table.engineTable');
console.log('ESPN Tables:', espnTables.length);
if (espnTables.length >= 3) {
    const trs = espnTables.eq(2).find('tr.data1');
    console.log('ESPN tr.data1 rows:', trs.length);
    if(trs.length > 0) {
        const tds = trs.eq(0).find('td');
        console.log('Sample ESPN Team:', tds.eq(0).text().trim(), 'Matches:', tds.eq(2).text().trim());
    }
}

const $2 = cheerio.load(fs.readFileSync('cricbuzz.html', 'utf8'));
console.log('Cricbuzz Title:', $2('title').text());
console.log('Cricbuzz cb-team-item:', $2('.cb-team-item').length);
if ($2('.cb-team-item').length > 0) {
    console.log('Sample CB team:', $2('.cb-team-item').eq(0).find('h2').text().trim());
} else {
    // maybe try looking for other team links
    console.log('Cricbuzz a tags with href matching /cricket-team/ :', $2('a[href*="/cricket-team/"]').length);
}
