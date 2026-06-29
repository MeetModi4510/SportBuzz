const fs = require('fs');
const cheerio = require('cheerio');

try {
    const html = fs.readFileSync('bdfutbol.html', 'utf8');
    const $ = cheerio.load(html);
    
    // bdfutbol typically uses a table with class taula or similar.
    const rows = $('table tr');
    let found = false;
    
    const results = [];
    rows.each((i, row) => {
        const text = $(row).text().replace(/\s+/g, ' ').trim();
        if (text) {
            results.push(text);
        }
    });
    
    fs.writeFileSync('bdfutbol_parsed.txt', results.join('\n'));
    console.log(`Parsed ${results.length} rows`);
} catch (e) {
    console.error(e.message);
}
