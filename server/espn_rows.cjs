const fs = require('fs');
const cheerio = require('cheerio');
const $ = cheerio.load(fs.readFileSync('espn.html', 'utf8'));

let found = false;
$('table').each((i, table) => {
    $(table).find('tr').each((j, tr) => {
        const rowText = $(tr).text().replace(/\s+/g, ' ').trim();
        if (rowText.includes('Matches') || rowText.includes('Won') || rowText.includes('India')) {
            console.log(`Table ${i} Row ${j}:`, rowText);
            found = true;
        }
    });
});
if (!found) {
    console.log("No cricket stats found in the tables.");
}
