import axios from 'axios';
import * as cheerio from 'cheerio';
async function test() {
    const res = await axios.get('https://www.hindustantimes.com/cricket/live-score');
    const $ = cheerio.load(res.data);
    const links = [];
    $('a[href*="/cricket/"]').each((i, el) => {
        const text = $(el).text().trim();
        const title = $(el).attr('title') || '';
        const href = $(el).attr('href');
        if (href && (href.includes('-live-score') || href.includes('live-scorecard'))) {
            links.push({ href, text: text.substring(0, 50), title });
        }
    });
    console.log(links.filter(l => JSON.stringify(l).includes('India')));
}
test();
