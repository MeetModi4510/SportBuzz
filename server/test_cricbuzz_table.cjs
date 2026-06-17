const axios = require('axios');
const cheerio = require('cheerio');

async function test() {
    const res = await axios.get('https://www.cricbuzz.com/profiles/1413/virat-kohli', { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const $ = cheerio.load(res.data);
    
    $('table').each((i, table) => {
        const context = $(table).prev('div').text().trim();
        if (context.includes('Batting Career Summary')) {
            console.log("Found Batting Table!");
            const headers = [];
            $(table).find('thead th').each((j, th) => headers.push($(th).text().trim()));
            console.log("Headers:", headers);
            
            $(table).find('tbody tr').each((j, tr) => {
                const cols = [];
                $(tr).find('td').each((k, td) => cols.push($(td).text().trim()));
                console.log("Row:", cols);
            });
        }
    });
}
test();
