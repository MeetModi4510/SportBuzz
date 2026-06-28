import https from 'https';
import * as cheerio from 'cheerio';
import fs from 'fs';

const url = 'https://stats.espncricinfo.com/ci/engine/stats/index.html?class=11;filter=advanced;groupby=ground;template=results;type=aggregate';

https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
    let d = ''; res.on('data', c => d+=c); res.on('end', () => {
        const $ = cheerio.load(d);
        const map = {};
        $('tr.data1, tr.data2').each((_, row) => {
            const link = $(row).find('td').eq(0).find('a').first();
            if (link.length) {
                const href = link.attr('href') || '';
                const idMatch = href.match(/ground=(\d+)/);
                if (idMatch) {
                    const id = idMatch[1];
                    const name = link.text().trim();
                    map[name.toLowerCase()] = parseInt(id);
                }
            }
        });
        console.log(`Found ${Object.keys(map).length} grounds!`);
        fs.writeFileSync('all_grounds_map.json', JSON.stringify(map, null, 2));
    });
});
