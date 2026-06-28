import { fetchESPN } from './services/espnStatsguruScraper.js';
import * as cheerio from 'cheerio';
const url = 'https://stats.espncricinfo.com/ci/engine/stats/index.html?class=1;team=6;template=results;type=aggregate;view=results';
fetchESPN(url).then(res => {
    const $ = cheerio.load(res.html);
    const table = $('table.engineTable').eq(2);
    table.find('tr.data1, tr.data2').each((i, row) => {
        const c = $(row).find('td').map((_, td) => $(td).text().trim()).get();
        if (c[4] && (c[4].includes('Chennai') || c[4].includes('Madras') || c[4].includes('Chidambaram'))) {
            const groundLink = $(row).find('td').eq(4).find('a').attr('href');
            console.log('Chennai Match:', c[4], 'Link:', groundLink);
        }
    });
}).catch(e => console.error(e));
