const fs = require('fs');
const cheerio = require('cheerio');
const $ = cheerio.load(fs.readFileSync('espn.html', 'utf8'));

$('table').each((i, el) => {
    console.log('Table ' + i + ' class:', $(el).attr('class'));
});
