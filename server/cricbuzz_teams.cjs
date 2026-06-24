const fs = require('fs');
const cheerio = require('cheerio');

const $2 = cheerio.load(fs.readFileSync('cricbuzz.html', 'utf8'));
const teams = [];
$2('a[href*="/cricket-team/"]').each((i, el) => {
    teams.push({
        name: $2(el).text().trim(),
        href: $2(el).attr('href')
    });
});
console.log('Cricbuzz teams:', teams.filter(t => t.name).slice(0, 10));
