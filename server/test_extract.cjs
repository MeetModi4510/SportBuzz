const cheerio = require('cheerio');
const axios = require('axios');

async function test() {
    const agg2Url = 'https://stats.espncricinfo.com/ci/engine/stats/index.html?class=1;ground=61;template=results;type=aggregate;innings_number=2';
    const res = await axios.get(agg2Url, {headers: {'User-Agent': 'Mozilla/5.0'}});
    const html = res.data;
    const $ = cheerio.load(html);
    const agg2 = $('table.engineTable').eq(2).find('tr.data1').first().find('td').map((_, el) => $(el).text().trim()).get();
    console.log('agg2:', agg2);
    
    // Now let's see how extractAgg does it
    const extractAgg = (html) => {
        if (!html) return [];
        const $ = cheerio.load(html);
        return $('table.engineTable').eq(2).find('tr.data1').first().find('td').map((_, el) => $(el).text().trim()).get();
    };
    console.log('extractAgg:', extractAgg(html));
}
test();
