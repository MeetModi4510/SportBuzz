import https from 'https';
import * as cheerio from 'cheerio';

async function findStatsguruId(name) {
    return new Promise((resolve) => {
        const encoded = encodeURIComponent(name);
        const rawUrl = `https://stats.espncricinfo.com/ci/engine/stats/index.html?class=11;filter=advanced;groundname=${encoded};orderby=start;template=results;type=aggregate;view=innings`;
        const urlObj = new URL(rawUrl);
        const opts = {
            hostname: urlObj.hostname,
            path: rawUrl.replace('https://' + urlObj.hostname, ''),
            headers: { 'User-Agent': 'Mozilla/5.0' },
        };
        https.get(opts, (res) => {
            let data = '';
            res.on('data', chunk => { data += chunk; });
            res.on('end', () => {
                // Find all investigate links that contain ground=\d+
                const matches = data.match(/ground=(\d+);/g);
                if (matches && matches.length > 0) {
                    const id = matches[0].match(/\d+/)[0];
                    console.log(`Found ID for ${name}: ${id}`);
                    resolve(id);
                } else {
                    console.log(`No Statsguru ID found for ${name}`);
                    resolve(null);
                }
            });
            res.on('error', resolve);
        });
    });
}

async function run() {
    await findStatsguruId('Wankhede');
    await findStatsguruId('Chidambaram');
    await findStatsguruId('Chinnaswamy');
    await findStatsguruId('Arun Jaitley');
    await findStatsguruId('Narendra Modi');
    await findStatsguruId('Rajiv Gandhi');
    await findStatsguruId('HPCA');
    await findStatsguruId('Vidarbha');
    await findStatsguruId('Barabati');
    await findStatsguruId('Saurashtra');
    await findStatsguruId('Barsapara');
    await findStatsguruId('Ekana');
}
run();
