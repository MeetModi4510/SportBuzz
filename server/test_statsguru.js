import axios from 'axios';
import * as cheerio from 'cheerio';

const H = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' };

async function testMatchRows() {
    const url = 'https://stats.espncricinfo.com/ci/engine/stats/index.html?class=2;team=6;template=results;type=team;view=match;orderby=start;orderbyad=reverse';
    const {data} = await axios.get(url, {headers: H});
    const $ = cheerio.load(data);
    
    $('table.engineTable').eq(2).find('tr.data1').slice(0, 5).each((i, row) => {
        const cols = $(row).find('td').map((j, el) => $(el).text().trim()).get();
        console.log(`[${i}] Cols:`, cols.join(' | '));
    });
}

testMatchRows();
