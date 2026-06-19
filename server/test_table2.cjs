const axios = require('axios');
const cheerio = require('cheerio');

axios.get('https://m.cricbuzz.com/profiles/8502/player', {
    headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1'
    }
}).then(res => {
    const $ = cheerio.load(res.data);
    const parseTable = (index) => {
        const table = $('table').eq(index);
        const stats = {};
        
        const headers = [];
        table.find('tr').eq(0).find('th, td').each((i, el) => {
            if (i > 0) headers.push($(el).text().trim());
        });

        table.find('tr').each((i, row) => {
            if (i === 0) return; // skip header
            const cells = [];
            $(row).find('td, th').each((_, cell) => cells.push($(cell).text().trim()));
            
            if (cells.length > 1) {
                const statName = cells[0].toLowerCase().replace(/\s+/g, '_');
                stats[statName] = {};
                headers.forEach((h, hIdx) => {
                    stats[statName][h.toLowerCase()] = cells[hIdx + 1];
                });
            }
        });
        return stats;
    };
    console.log("Table 0:");
    console.log(JSON.stringify(parseTable(0)));
    console.log("Table 1:");
    console.log(JSON.stringify(parseTable(1)));
}).catch(e=>console.log(e.message));
