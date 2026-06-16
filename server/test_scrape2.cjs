const cheerio = require('cheerio');
const fs = require('fs');
const html = fs.readFileSync('test_england.html', 'utf8');
const $ = cheerio.load(html);
const links = [];
$('a').each((i, el) => {
    const href = $(el).attr('href');
    if (href) links.push(href);
});
console.log([...new Set(links)].filter(l => l.includes('profile') || l.includes('player')).slice(0, 20));
