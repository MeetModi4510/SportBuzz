const fs = require('fs');
const cheerio = require('cheerio');

try {
    const html = fs.readFileSync('bdfutbol2.html', 'utf8');
    const $ = cheerio.load(html);
    
    // Look for stadium names, typically in tables or lists
    // Let's find tables
    const results = [];
    $('table').each((tableIndex, table) => {
        $(table).find('tr').each((i, row) => {
            const cells = $(row).find('th, td').map((_, td) => $(td).text().replace(/\s+/g, ' ').trim()).get();
            if (cells.length > 0) {
                results.push(`Table ${tableIndex} Row ${i}: ` + cells.join(' | '));
            }
        });
    });
    
    if (results.length === 0) {
        // Maybe it's a list? Let's just grab main content
        results.push("No tables found. Body snippet:");
        results.push($('body').text().replace(/\s+/g, ' ').substring(0, 2000));
    }
    
    fs.writeFileSync('bdfutbol_parsed.txt', results.join('\n'));
    console.log(`Parsed ${results.length} rows`);
} catch (e) {
    console.error(e.message);
}
