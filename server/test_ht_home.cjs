const axios = require('axios');
const cheerio = require('cheerio');
async function testHTHome() {
    try {
        const res = await axios.get('https://www.hindustantimes.com/cricket', {
            headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 10000
        });
        const $ = cheerio.load(res.data);
        $('a').each((i, el) => {
            const href = $(el).attr('href') || '';
            if (href.includes('result') || href.includes('completed')) {
                console.log(href);
            }
        });
    } catch(e) {}
}
testHTHome();
