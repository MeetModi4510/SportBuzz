const axios = require('axios');
const cheerio = require('cheerio');

axios.get('https://m.cricbuzz.com/profiles/8056/player', {
    headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1'
    }
}).then(res => {
    const $ = cheerio.load(res.data);
    let numTables = $('table').length;
    console.log("Total tables found:", numTables);
    
    $('table').each((i, tbl) => {
        let firstCell = $(tbl).find('tr').eq(1).find('td, th').first().text().trim();
        let tableHeader = $(tbl).find('tr').eq(0).text().trim();
        console.log(`Table ${i} -> Header Row: "${tableHeader}", First Cell Row 1: "${firstCell}"`);
    });

}).catch(e => console.log(e.message));
