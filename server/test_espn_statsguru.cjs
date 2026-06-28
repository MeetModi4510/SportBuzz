const https = require('https');
const cheerio = require('cheerio');

function fetchRaw(rawUrl) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(rawUrl);
        const opts = {
            hostname: urlObj.hostname,
            path: rawUrl.replace(`https://${urlObj.hostname}`, ''),
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/125.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Referer': 'https://www.espncricinfo.com/',
            },
            timeout: 15000,
        };
        let data = '';
        const req = https.get(opts, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                return fetchRaw(res.headers.location).then(resolve).catch(reject);
            }
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve({ status: res.statusCode, data }));
        });
        req.on('error', reject);
        req.setTimeout(15000, () => { req.destroy(); reject(new Error('Timeout')); });
    });
}

const BASE = 'https://stats.espncricinfo.com/ci/engine/stats/index.html';
const GID  = '292'; // Eden Gardens

async function inspectColumns(label, url) {
    console.log(`\n=== ${label} ===`);
    const { data } = await fetchRaw(url);
    const $ = cheerio.load(data);
    const table = $('table.engineTable').eq(2);
    
    // Try all header row selectors
    const h1 = table.find('tr.head th').map((_, c) => $(c).text().trim()).get();
    const h2 = table.find('th').map((_, c) => $(c).text().trim()).get();
    console.log('Header (tr.head th):', h1);
    console.log('All th:', h2);
    
    // Check actual HTML of first header row
    const firstHeaderRow = table.find('tr').first();
    console.log('First row HTML snippet:', firstHeaderRow.html()?.substring(0, 300));
    
    // Show first 3 data rows with index
    table.find('tr.data1, tr.data2').slice(0, 3).each((i, row) => {
        const cols = $(row).find('td').map((_, c) => $(c).text().trim()).get();
        console.log(`Row ${i}: [${cols.map((c,j) => `[${j}]${c}`).join(', ')}]`);
    });
}

async function main() {
    await inspectColumns('BATTING', `${BASE}?class=1;ground=${GID};template=results;type=batting`);
    await inspectColumns('BOWLING', `${BASE}?class=1;ground=${GID};template=results;type=bowling`);
    await inspectColumns('MATCH LIST', `${BASE}?class=1;filter=advanced;ground=${GID};orderby=start;orderbyad=reverse;template=results;type=team;view=match`);
}

main().catch(console.error);
