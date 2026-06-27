const fs = require('fs');
const cheerio = require('cheerio');
const $ = cheerio.load(fs.readFileSync('fow_trophy.html', 'utf8'));
console.log($('title').text());
$('table.engineTable').eq(2).find('tr.data1').slice(0, 1).each((i, el) => {
    const tds = $(el).find('td');
    let str = `Row ${i}: `;
    for (let j=0; j<tds.length; j++) str += `td${j}=` + $(tds[j]).text().trim() + ' ';
    console.log(str);
});
