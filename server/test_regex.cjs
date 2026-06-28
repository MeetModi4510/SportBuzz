const cheerio = require('cheerio');
const html = `<tr><td nowrap="nowrap" class="left"><a href="/ci/engine/ground/57980.html" class="data-link">Eden Gardens, Kolkata</a></td></tr>`;
const $ = cheerio.load(html);
const aTag = $('td').find('a');
const href = aTag.attr('href') || '';
console.log('href:', href);
const idMatch = href.match(/ground\/(\d+)\.html/);
console.log('Match:', idMatch);
