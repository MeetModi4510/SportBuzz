const axios = require('axios');
const cheerio = require('cheerio');
async function run() {
    const url = 'https://stats.espncricinfo.com/ci/engine/stats/index.html?class=1;host=6;template=results;type=aggregate;view=ground';
    const {data} = await axios.get(url, {headers: {'User-Agent': 'Mozilla/5.0'}});
    const $ = cheerio.load(data);
    const rows = $('table.engineTable').eq(2).find('tr');
    rows.each((i, row) => {
        const cols = $(row).find('td');
        if (cols.length === 1) {
            console.log("Name row HTML:", $(row).html());
            return false;
        }
    });
}
run();
