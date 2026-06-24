const fs = require('fs');
const cheerio = require('cheerio');
const $ = cheerio.load(fs.readFileSync('espn.html', 'utf8'));
console.log('Tables:', $('table').length);
console.log('Text:', $('body').text().substring(0, 500).replace(/\s+/g, ' '));
