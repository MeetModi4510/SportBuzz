const axios = require('axios');
const cheerio = require('cheerio');
const HEADERS = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'};

async function testEspnRecords() {
    try {
        const res = await axios.get('https://www.espncricinfo.com/records/team/match-results/india-6/test-matches-1', {headers: HEADERS});
        const $ = cheerio.load(res.data);
        const nextData = $('#__NEXT_DATA__').html();
        console.log('Next data found?', !!nextData);
        if(nextData) console.log(nextData.substring(0, 200));
    } catch (e) {
        console.error(e.message);
    }
}
testEspnRecords();
