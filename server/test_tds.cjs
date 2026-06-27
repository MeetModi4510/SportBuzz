const fs = require('fs');
const cheerio = require('cheerio');
const $ = cheerio.load(fs.readFileSync('fow.html', 'utf8'));
$('table.engineTable').eq(2).find('tr.data1').slice(0, 5).each((i, el) => {
    const tds = $(el).find('td');
    let str = `Row ${i}: `;
    for (let j=0; j<tds.length; j++) str += `td${j}=` + $(tds[j]).text().trim() + ' ';
    console.log(str);
});
