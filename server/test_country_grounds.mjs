import https from 'https';
import * as cheerio from 'cheerio';

const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-GB,en;q=0.5',
    'Accept-Encoding': 'identity',
    'Connection': 'keep-alive',
};

function fetchESPN(rawUrl) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(rawUrl);
        const opts = {
            hostname: urlObj.hostname,
            path: rawUrl.replace(`https://${urlObj.hostname}`, ''),
            headers: HEADERS,
            timeout: 15000,
        };
        let data = '';
        const req = https.get(opts, (res) => {
            res.on('data', chunk => { data += chunk; });
            res.on('end', () => resolve({ status: res.statusCode, html: data }));
        });
        req.on('error', reject);
        req.setTimeout(15000, () => { req.destroy(); reject(new Error('timeout')); });
    });
}

// ESPN team IDs for the host countries
// home_or_away=1 = home matches, team= = the team playing at home
// This gives grounds where that country hosts matches
// class=11 = all international formats
const TEAM_IDS = {
    India:        6,
    Australia:    2,
    England:      1,
    Pakistan:     7,
    SouthAfrica:  3,
    SriLanka:     8,
    Bangladesh:   25,
    WestIndies:   4,
    UAE:          8319, // try
    Afghanistan:  40,
};

async function getGroundsForCountry(countryName, teamId) {
    // Statsguru: home matches, grouped by ground, all formats
    const url = `https://stats.espncricinfo.com/ci/engine/stats/index.html?class=11;filter=advanced;home_or_away=1;orderby=ground;team=${teamId};template=results;type=aggregate;view=ground`;
    const res = await fetchESPN(url);
    console.log(`${countryName} (team=${teamId}): status=${res.status} size=${res.html.length}`);
    
    if (res.status !== 200) return {};
    
    const $ = cheerio.load(res.html);
    const grounds = {};
    
    $('tr.data1, tr.data2').each((_, row) => {
        const cells = $(row).find('td');
        const link = cells.eq(0).find('a').first();
        const href = link.attr('href') || '';
        const idMatch = href.match(/ground=(\d+)/);
        const name = link.text().trim() || cells.eq(0).text().trim();
        if (idMatch && name) {
            grounds[name] = parseInt(idMatch[1]);
            console.log(`  ✓ ${name} → ID ${idMatch[1]}`);
        }
    });
    
    const count = Object.keys(grounds).length;
    console.log(`  Found ${count} grounds for ${countryName}\n`);
    return grounds;
}

// Test with India first
const indiaGrounds = await getGroundsForCountry('India', 6);
console.log('\nTotal India grounds:', Object.keys(indiaGrounds).length);
