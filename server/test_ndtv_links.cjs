const axios = require('axios');
const cheerio = require('cheerio');
async function test() {
    const res = await axios.get('https://sports.ndtv.com/cricket/live-scores', {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });
    const $ = cheerio.load(res.data);
    const links = [];
    $('a[href*="/cricket/"]').each((i, el) => {
        const href = $(el).attr('href');
        const text = $(el).text().trim();
        if (href && (href.includes('-live-score') || href.includes('live-scorecard') || href.includes('match') || href.includes('scorecard'))) {
            links.push({ href, text: text.substring(0, 30) });
        }
    });
    console.log(links.slice(0, 20));
}
test();
