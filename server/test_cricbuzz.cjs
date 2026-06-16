const axios = require('axios');
const cheerio = require('cheerio');

async function test() {
    try {
        const res = await axios.get('https://www.cricbuzz.com/cricket-team/india/2/players', {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
        });
        const $ = cheerio.load(res.data);
        const players = [];
        $('a.cb-col.cb-col-50, div.cb-col-67 a').each((i, el) => {
            const name = $(el).find('.cb-font-16').text().trim() || $(el).text().trim();
            const url = 'https://www.cricbuzz.com' + $(el).attr('href');
            const img = $(el).find('img').attr('src');
            if (name && url.includes('/profiles/')) players.push({ name, url, img });
        });
        console.log('INDIA SQUAD (first 5):', players.slice(0, 5));

        const gillRes = await axios.get('https://www.cricbuzz.com/profiles/10713/shubman-gill', {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
        });
        const $g = cheerio.load(gillRes.data);
        let photo = $g('img[title="Profile Photo"]').attr('src');
        if (!photo) {
            $g('img').each((i, img) => {
                const src = $g(img).attr('src');
                if (src && src.includes('player')) photo = src;
            });
        }
        console.log('GILL PHOTO:', photo);

        const stats = [];
        $g('table.table').first().find('tbody tr').each((i, row) => {
            const cols = [];
            $g(row).find('td').each((j, col) => cols.push($g(col).text().trim()));
            stats.push(cols);
        });
        console.log('GILL BATTING STATS:', stats);
    } catch (e) {
        console.error('Error:', e.message);
    }
}
test();
