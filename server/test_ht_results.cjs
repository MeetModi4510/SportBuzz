const axios = require('axios');
const cheerio = require('cheerio');

async function testResults() {
    try {
        const res = await axios.get('https://www.hindustantimes.com/cricket/results', {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' },
            timeout: 10000
        });
        const $ = cheerio.load(res.data);
        const links = [];
        $('a[href*="/cricket/"]').each((i, el) => {
            const href = $(el).attr('href');
            if (href && href.includes('match-result')) {
                const text = $(el).text().trim();
                links.push({ href, text });
            }
        });
        console.log("HT Results Links Found:", links.length);
        console.log(links.slice(0, 5));
    } catch(e) {
        console.log("HT Results Error:", e.message);
    }
}
testResults();
