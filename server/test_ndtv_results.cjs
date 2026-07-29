const axios = require('axios');
const cheerio = require('cheerio');
async function testNDTVResults() {
    try {
        const res = await axios.get('https://sports.ndtv.com/cricket/results', {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
            timeout: 10000
        });
        const $ = cheerio.load(res.data);
        const links = [];
        $('a[href*="/cricket/"]').each((i, el) => {
            const href = $(el).attr('href');
            if (href && (href.includes('-match-result') || href.includes('scorecard') || href.includes('-score-'))) {
                const text = $(el).text().trim();
                if (text.length > 5) {
                    links.push({ href, text });
                }
            }
        });
        console.log("NDTV Results Links Found:", links.length);
        console.log(links.slice(0, 10));
    } catch(e) {
        console.log("NDTV Results Error:", e.message);
    }
}
testNDTVResults();
