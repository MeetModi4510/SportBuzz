const axios = require('axios');
const cheerio = require('cheerio');

axios.get('https://m.cricbuzz.com/profiles/8502/player', {
    headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1'
    }
}).then(res => {
    const $ = cheerio.load(res.data);
    const tables = $('table');
    tables.each((i, table) => {
        console.log(`Table ${i}:`);
        $(table).find('tr').each((j, row) => {
            const firstCell = $(row).find('td, th').eq(0).text().trim();
            console.log(`  Row ${j}: ${firstCell}`);
        });
    });
}).catch(e=>console.log(e.message));
