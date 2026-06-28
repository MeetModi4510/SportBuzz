// Test StatGuru with proper ground ID format + full data extraction
import axios from 'axios';
import * as cheerio from 'cheerio';

const ESPN_HEADERS = { 
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
};

async function testStatGuruByGround(groundId, groundName) {
    // StatGuru uses numeric ground IDs internally. Let's find the stats using ground view
    // This is the same URL structure from the team analysis
    const url = `https://stats.espncricinfo.com/ci/engine/stats/index.html?class=2;host=6;ground=${groundId};template=results;type=team`;
    console.log(`\n🏟️ Testing StatGuru (host=India) for ground ID: ${groundId} (${groundName})`);
    
    const { data } = await axios.get(url, { headers: ESPN_HEADERS, timeout: 15000 });
    const $ = cheerio.load(data);
    
    const tables = $('table.engineTable');
    tables.eq(2).find('tr.data1, tr.data2').each((i, row) => {
        const cols = $(row).find('td');
        const rowData = [];
        cols.each((j, col) => rowData.push($(col).text().trim()));
        if (rowData.join('').trim()) console.log(`  Row ${i}:`, rowData.join(' | '));
    });
}

async function testStatGuruSearchGround(groundName) {
    // Use the search/ground_results approach 
    const url = `https://stats.espncricinfo.com/ci/engine/stats/index.html?class=11;host=6;template=results;type=aggregate;view=ground`;
    console.log(`\n🌍 Testing ALL Indian grounds via StatGuru aggregate view`);
    console.log('URL:', url);
    
    const { data } = await axios.get(url, { headers: ESPN_HEADERS, timeout: 15000 });
    const $ = cheerio.load(data);
    
    const tables = $('table.engineTable');
    console.log('Tables found:', tables.length);
    
    const grounds = [];
    let pendingData = null;
    
    tables.eq(2).find('tr').each((i, row) => {
        const cols = $(row).find('td');
        const isData = $(row).hasClass('data1') || $(row).hasClass('data2');
        
        if (isData && cols.length > 5) {
            const mat = parseInt($(cols[2]).text()) || 0;
            const won = parseInt($(cols[3]).text()) || 0;
            const lost = parseInt($(cols[4]).text()) || 0;
            pendingData = { mat, won, lost };
        } else if (cols.length === 1 && pendingData) {
            const groundName = $(cols[0]).text().trim();
            if (groundName) {
                grounds.push({ ground: groundName, ...pendingData });
                pendingData = null;
            }
        }
    });
    
    console.log(`Found ${grounds.length} grounds.`);
    grounds.slice(0, 15).forEach(g => {
        console.log(`  ${g.ground}: ${g.mat} matches, ${g.won}W ${g.lost}L`);
    });
    return grounds;
}

async function testWikipediaImages(venues) {
    console.log('\n\n🖼️ TESTING WIKIPEDIA IMAGES FOR MULTIPLE VENUES');
    const results = {};
    
    for (const name of venues) {
        const r = await axios.get(`https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(name)}&prop=pageimages&format=json&pithumbsize=500&pilicense=any`, {
            headers: { 'User-Agent': 'SportBuzz/1.0 (contact@sportbuzz.app)' }
        });
        const pages = r.data.query.pages;
        const pageId = Object.keys(pages)[0];
        const imgUrl = pages[pageId]?.thumbnail?.source || null;
        console.log(`  ${name}: ${imgUrl ? '✅ ' + imgUrl.substring(0, 80) + '...' : '❌ No image'}`);
        results[name] = imgUrl;
    }
    return results;
}

async function main() {
    // Test 1: Get ALL Indian grounds from StatGuru (like team analysis does)
    const grounds = await testStatGuruSearchGround('India');
    
    // Test 2: Now test Wikipedia images for those grounds
    const sampleGrounds = grounds.slice(0, 10).map(g => g.ground.split(',')[0].trim());
    await testWikipediaImages(sampleGrounds);
}

main().catch(console.error);
