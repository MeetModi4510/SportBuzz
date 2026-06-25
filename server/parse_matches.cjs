const fs = require('fs');
const html = fs.readFileSync('mobile_matches.html', 'utf8');

const cheerio = require('cheerio');
const $ = cheerio.load(html);

const matches = [];
$('a').each((i, el) => {
    const text = $(el).text().trim();
    if (text.includes('Super Kings') || text.includes('vs')) {
        matches.push(text.substring(0, 50));
    }
});

console.log("Mobile matches links:", matches.slice(0, 10));
