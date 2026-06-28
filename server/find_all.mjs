import https from 'https';
import * as cheerio from 'cheerio';
const url = 'https://stats.espncricinfo.com/ci/engine/stats/index.html?class=11;template=results;type=aggregate;view=ground';
https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
    let data = '';
    res.on('data', chunk => { data += chunk; });
    res.on('end', () => {
        const matches = data.match(/<a href="\/ci\/content\/ground\/(\d+)\.html"[^>]*>(.*?)<\/a>/g);
        if (matches) {
            matches.forEach(m => {
                const match = m.match(/<a href="\/ci\/content\/ground\/(\d+)\.html"[^>]*>(.*?)<\/a>/);
                if (match) console.log(`${match[1]} - ${match[2]}`);
            });
        }
    });
});
