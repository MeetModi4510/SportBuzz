const axios = require('axios');
const cheerio = require('cheerio');
const HEADERS = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'};

async function testEspnRecords() {
    try {
        const res = await axios.get('https://www.espncricinfo.com/records/team/match-results/india-6/test-matches-1', {headers: HEADERS});
        const $ = cheerio.load(res.data);
        console.log("Title:", $('title').text());
        const tables = $('table');
        console.log("Tables:", tables.length);
        if(tables.length > 0) {
            tables.eq(0).find('tr').slice(0, 5).each((i, tr) => {
                console.log($(tr).text().replace(/\s+/g, ' '));
            });
        }
    } catch (e) {
        console.error(e.message);
    }
}
testEspnRecords();
