const axios = require('axios');
const cheerio = require('cheerio');

const ESPN_HEADERS = { 
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
};

async function getGroundId(countryHostId, groundName) {
    const url = `https://stats.espncricinfo.com/ci/engine/stats/index.html?class=11;host=${countryHostId};template=results;type=aggregate;view=ground`;
    const { data } = await axios.get(url, { headers: ESPN_HEADERS, timeout: 15000 });
    const $ = cheerio.load(data);
    
    let groundId = null;
    $('table.engineTable').eq(2).find('tr').each((i, row) => {
        const cols = $(row).find('td');
        if (cols.length === 1) {
            const a = $(cols[0]).find('a');
            const name = a.text().trim();
            if (name.toLowerCase().includes(groundName.toLowerCase())) {
                const href = a.attr('href');
                if (href) {
                    const match = href.match(/ground\/(\d+)\.html/);
                    if (match) groundId = match[1];
                }
            }
        }
    });
    return groundId;
}

async function findDropdownId(groundName) {
    const url = `https://stats.espncricinfo.com/ci/engine/stats/index.html?class=1;filter=advanced`;
    const res = await fetch(url, { headers: ESPN_HEADERS });
    const data = await res.text();
    const $ = cheerio.load(data);
    let dropdownId = null;
    $('select[name="ground"] option').each((i, el) => {
        if ($(el).text().toLowerCase().includes(groundName.toLowerCase())) {
            dropdownId = $(el).attr('value');
            console.log(`Dropdown ID for ${groundName}:`, dropdownId);
        }
    });
    return dropdownId;
}

async function scrapeDeep() {
    const dropdownId = await findDropdownId("Eden Gardens");
    if (!dropdownId) return;
    
    // Test with class=11 (All matches)
    const urlHighLow = `https://stats.espncricinfo.com/ci/engine/stats/index.html?class=11;filter=advanced;ground=${dropdownId};template=results;type=team;view=innings;sort=score;direction=desc`;
    console.log(urlHighLow);
    const res = await fetch(urlHighLow, { headers: ESPN_HEADERS });
    const hlData = await res.text();
    const $hl = cheerio.load(hlData);
    
    const rows = $hl('table.engineTable').eq(2).find('tr.data1, tr.data2');
    console.log("Rows found:", rows.length);
    if(rows.length > 0) {
        console.log("Highest Score First row text:", $hl(rows[0]).text().trim().replace(/\n+/g, ' '));
    }
}

scrapeDeep();
