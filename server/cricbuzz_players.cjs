const fs = require('fs');
const cheerio = require('cheerio');
const $ = cheerio.load(fs.readFileSync('cricbuzz_players.html', 'utf8'));
const links = [];
$('a').each((i, el) => {
    const href = $(el).attr('href');
    if(href && href.includes('/profiles/')) {
        links.push({
            name: $(el).text().trim(),
            href: href
        });
    }
});
console.log('Player links:', links.filter(l => l.name).slice(0, 20));
