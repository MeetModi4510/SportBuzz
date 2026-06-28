// Test ESPN Statsguru for: highest/lowest totals, toss preference, avg run rate
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
                'Accept': 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8',
                'Referer': 'https://www.espncricinfo.com/',
            },
            timeout: 15000,
        };
        let data = '';
        const req = https.get(opts, (res) => {
            res.on('data', c => data += c);
            res.on('end', () => resolve({ status: res.statusCode, data }));
        });
        req.on('error', reject);
        req.setTimeout(15000, () => { req.destroy(); reject(new Error('Timeout')); });
    });
}

const BASE = 'https://stats.espncricinfo.com/ci/engine/stats/index.html';
const GID = '292'; // Eden Gardens, Test

async function test(label, url) {
    console.log(`\n=== ${label} ===`);
    console.log('URL:', url.replace(BASE, 'BASE'));
    const { status, data } = await fetchRaw(url);
    console.log('Status:', status);
    if (status !== 200) { console.log('FAIL'); return; }
    const $ = cheerio.load(data);
    const table = $('table.engineTable').eq(2);
    const rows = table.find('tr.data1, tr.data2');
    console.log('Rows found:', rows.length);
    rows.slice(0, 5).each((i, row) => {
        const cols = $(row).find('td').map((_, c) => $(c).text().trim()).get();
        console.log(`  [${i}] ${cols.map((c,j) => `[${j}]${c}`).join(' | ')}`);
    });
}

async function main() {
    // 1. Highest total: innings sorted by runs DESC
    await test('HIGHEST TOTALS (runs desc)',
        `${BASE}?class=1;filter=advanced;ground=${GID};orderby=runs;orderbyad=reverse;template=results;type=team;view=innings`
    );

    // 2. Lowest total: innings sorted by runs ASC
    await test('LOWEST TOTALS (runs asc)',
        `${BASE}?class=1;filter=advanced;ground=${GID};orderby=runs;template=results;type=team;view=innings`
    );

    // 3. Toss: won toss + chose to bat (toss=1)
    await test('TOSS WON + BATTED (toss=1)',
        `${BASE}?class=1;filter=advanced;ground=${GID};toss=1;template=results;type=team;view=match`
    );

    // 4. Toss: won toss + chose to field (toss=2)
    await test('TOSS WON + FIELDED (toss=2)',
        `${BASE}?class=1;filter=advanced;ground=${GID};toss=2;template=results;type=team;view=match`
    );

    // 5. Innings with RPO column visible
    await test('INNINGS WITH RPO (for avg run rate)',
        `${BASE}?class=1;filter=advanced;ground=${GID};groupby=innings;orderby=innings_number;template=results;type=team;view=innings`
    );
}

main().catch(console.error);
