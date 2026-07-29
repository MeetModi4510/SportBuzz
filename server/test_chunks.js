import fs from 'fs';
import * as cheerio from 'cheerio';

const html = fs.readFileSync('historical_comm.html', 'utf8');
const $ = cheerio.load(html);

console.log('Number of p tags:', $('p').length);
console.log('Number of .cb-col.cb-col-100.ng-scope:', $('.cb-col.cb-col-100.ng-scope').length);
console.log('Number of .cb-com-ln:', $('.cb-com-ln').length);
console.log('Number of divs:', $('div').length);
console.log('Text of first few p tags:');
$('p').slice(0, 5).each((i, el) => console.log($(el).text()));
