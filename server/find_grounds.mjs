import https from 'https';
import * as cheerio from 'cheerio';

const ids = [];
for (let i = 301; i <= 1000; i++) ids.push(i);

async function fetchGround(id) {
    return new Promise((resolve) => {
        const rawUrl = `https://stats.espncricinfo.com/ci/engine/stats/index.html?class=11;filter=advanced;ground=${id};orderby=start;template=results;type=aggregate;view=ground`;
        const urlObj = new URL(rawUrl);
        const opts = {
            hostname: urlObj.hostname,
            path: rawUrl.replace('https://' + urlObj.hostname, ''),
            headers: { 'User-Agent': 'Mozilla/5.0' },
        };
        https.get(opts, (res) => {
            let data = '';
            res.on('data', chunk => { data += chunk; });
            res.on('end', () => {
                const $ = cheerio.load(data);
                const titleText = $('table.engineTable').eq(2).find('tr.title td').text().trim();
                if (titleText && !titleText.includes('No records')) {
                    console.log(`${id}: ${titleText.split('-')[0].trim()}`);
                }
                resolve();
            });
            res.on('error', resolve);
        });
    });
}

async function run() {
    console.log('Starting 301-1000...');
    for (const id of ids) {
        await fetchGround(id);
    }
    console.log('Done');
}
run();
