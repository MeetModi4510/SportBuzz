import https from 'https';
import fs from 'fs';

async function fetchGroundsPage(page) {
    return new Promise((resolve) => {
        const url = `https://stats.espncricinfo.com/ci/engine/stats/index.html?class=11;page=${page};template=results;type=aggregate;view=ground`;
        https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
            let data = '';
            res.on('data', chunk => { data += chunk; });
            res.on('end', () => {
                const map = {};
                // Strategy: split by "investigate this query" image
                const parts = data.split('alt="investigate this query"');
                for (let i = 0; i < parts.length - 1; i++) {
                    const block = parts[i];
                    
                    // The ground name is usually in the preceding block or right before this one.
                    // Let's grab all data-links and take the last one which corresponds to the team, and the second to last which is the ground
                    const linkMatches = [...block.matchAll(/class="data-link">([^<]+)<\/a>/g)];
                    if (linkMatches.length >= 1) {
                         const name = linkMatches[linkMatches.length - 2] ? linkMatches[linkMatches.length - 2][1].trim() : linkMatches[linkMatches.length - 1][1].trim();
                         
                         // The ID is in the menuLayers call
                         const idMatch = block.match(/ground=(\d+)/g);
                         if (idMatch && idMatch.length > 0) {
                             const id = idMatch[idMatch.length - 1].match(/\d+/)[0];
                             map[name.toLowerCase()] = { id: parseInt(id), name };
                         }
                    }
                }
                resolve(map);
            });
        });
    });
}

async function run() {
    console.log('Fetching all grounds from Statsguru (pages 1-15)...');
    let allGrounds = {};
    for (let i = 1; i <= 15; i++) { // Should cover ~750 grounds
        const map = await fetchGroundsPage(i);
        Object.assign(allGrounds, map);
        console.log(`Page ${i}: Found ${Object.keys(map).length} grounds`);
        await new Promise(r => setTimeout(r, 200)); // Sleep between requests
    }
    fs.writeFileSync('statsguru_all_grounds_map.json', JSON.stringify(allGrounds, null, 2));
    console.log(`Saved ${Object.keys(allGrounds).length} grounds to statsguru_all_grounds_map.json`);
}
run();
