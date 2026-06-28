const axios = require('axios');
const cheerio = require('cheerio');
async function run() {
    const {data} = await axios.get('https://stats.espncricinfo.com/ci/engine/stats/index.html?class=1;host=6;template=results;type=aggregate;view=ground', {headers: {'User-Agent': 'Mozilla/5.0'}});
    const $ = cheerio.load(data);
    $('table.engineTable').eq(2).find('tr').each((i, row) => {
        const a = $(row).find('td').eq(0).find('a');
        if(a.text().includes('Eden Gardens')) {
            console.log(a.attr('href'));
        }
    });
}
run();
