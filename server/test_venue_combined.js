// Final combined test: StatGuru + Wikipedia images with smart name matching
import axios from 'axios';
import * as cheerio from 'cheerio';

const ESPN_HEADERS = { 
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
};

async function fetchAllGroundStatsForCountry(hostId, formatClass) {
    // host IDs: India=6, Australia=2, England=1, etc.
    const url = `https://stats.espncricinfo.com/ci/engine/stats/index.html?class=${formatClass};host=${hostId};template=results;type=aggregate;view=ground`;
    const { data } = await axios.get(url, { headers: ESPN_HEADERS, timeout: 15000 });
    const $ = cheerio.load(data);
    
    const grounds = [];
    let pendingData = null;
    
    $('table.engineTable').eq(2).find('tr').each((i, row) => {
        const cols = $(row).find('td');
        const isData = $(row).hasClass('data1') || $(row).hasClass('data2');
        
        if (isData && cols.length > 5) {
            const mat = parseInt($(cols[2]).text()) || 0;
            const won = parseInt($(cols[3]).text()) || 0;
            const lost = parseInt($(cols[4]).text()) || 0;
            const tied = parseInt($(cols[5]).text()) || 0;
            const nr = parseInt($(cols[6]).text()) || 0;
            const highScore = $(cols[10]).text().trim();
            const lowScore = $(cols[11]).text().trim();
            pendingData = { mat, won, lost, tied, nr, highScore, lowScore };
        } else if (cols.length === 1 && pendingData) {
            const groundName = $(cols[0]).text().trim();
            if (groundName) {
                grounds.push({ 
                    ground: groundName, 
                    ...pendingData,
                    winPct: pendingData.mat > 0 ? Math.round((pendingData.won / pendingData.mat) * 100) : 0
                });
                pendingData = null;
            }
        }
    });
    return grounds;
}

async function getWikipediaImage(stadiumName) {
    // Try multiple name variations to find the image
    const variations = [
        stadiumName,
        stadiumName.replace('MA Chidambaram Stadium, Chepauk, Chennai', 'M. A. Chidambaram Stadium'),
        stadiumName.replace('M.Chinnaswamy Stadium', 'M. Chinnaswamy Stadium'),
        stadiumName.replace('Sardar Vallabhai Patel Stadium', 'Sardar Vallabhbhai Patel Stadium'),
        stadiumName.split(',')[0].trim(),  // Just the stadium name without city
    ];
    
    for (const name of variations) {
        const r = await axios.get(`https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(name)}&prop=pageimages&format=json&pithumbsize=500&pilicense=any`, {
            headers: { 'User-Agent': 'SportBuzz/1.0 (contact@sportbuzz.app)' }
        });
        const pages = r.data.query.pages;
        const pageId = Object.keys(pages)[0];
        const img = pages[pageId]?.thumbnail?.source;
        if (img) return img;
    }
    return null;
}

async function main() {
    console.log('🔍 Fetching ALL India ODI ground stats from StatGuru...');
    
    // FORMAT_CLASS: 1=Test, 2=ODI, 3=T20I, 11=All
    // HOST_IDS: India=6, Australia=2, England=1, SA=3, NZ=5, Pak=7, SL=8, WI=4
    const grounds = await fetchAllGroundStatsForCountry(6, 2); // India ODIs
    
    console.log(`\n✅ Got ${grounds.length} grounds from StatGuru!`);
    
    // Now fetch Wikipedia images for first 5 as sample
    console.log('\n🖼️ Fetching Wikipedia images...');
    for (const g of grounds.slice(0, 8)) {
        const img = await getWikipediaImage(g.ground);
        console.log(`\n  📍 ${g.ground}`);
        console.log(`     Matches: ${g.mat} | Won: ${g.won} | Lost: ${g.lost} | Win%: ${g.winPct}%`);
        console.log(`     High Score: ${g.highScore} | Low Score: ${g.lowScore}`);
        console.log(`     Image: ${img ? '✅ ' + img.substring(0, 80) : '❌ Not found'}`);
    }
}

main().catch(console.error);
