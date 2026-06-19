import * as cheerio from 'cheerio';
import fs from 'fs';

const html = fs.readFileSync('cricbuzz_mobile_profile.html', 'utf8');
const $ = cheerio.load(html);

// Find tables
$('table').each((i, tbl) => {
    console.log('Table ' + i);
    $(tbl).find('tr').each((j, tr) => {
        const row = [];
        $(tr).find('td, th').each((k, td) => {
            row.push($(td).text().trim());
        });
        if(row.length > 0 && j < 3) console.log(row.join(' | '));
    });
    console.log('---');
});

// Personal info
console.log('Personal Info:');
$('.cb-list-item').each((i, el) => {
    console.log($(el).text().trim().replace(/\s+/g, ' '));
});
