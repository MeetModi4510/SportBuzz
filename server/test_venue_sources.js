// Test 1: ESPNCricinfo StatGuru - venue stats by ground name (exact URL from the screenshot)
// Test 2: Wikipedia API - get stadium image for a venue
import axios from 'axios';
import * as cheerio from 'cheerio';

const ESPN_HEADERS = { 
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml',
    'Accept-Language': 'en-US,en;q=0.9'
};

async function testStatGuruVenueStats(groundName) {
    // StatGuru: search by ground name - same technique used in team analysis
    // class=1=Test, 2=ODI, 3=T20I
    const url = `https://stats.espncricinfo.com/ci/engine/stats/index.html?class=2;ground=${encodeURIComponent(groundName)};template=results;type=team;view=ground`;
    console.log('\n🏟️ Testing StatGuru for:', groundName);
    console.log('URL:', url);
    
    const { data } = await axios.get(url, { headers: ESPN_HEADERS, timeout: 15000 });
    const $ = cheerio.load(data);
    
    // Find the main engine table
    const tables = $('table.engineTable');
    console.log('Tables found:', tables.length);
    
    // Print all rows from table 2 (the data table)
    const rows = [];
    tables.eq(2).find('tr.data1, tr.data2').each((i, row) => {
        const cols = $(row).find('td');
        const rowData = [];
        cols.each((j, col) => rowData.push($(col).text().trim()));
        rows.push(rowData);
    });
    
    console.log('Data rows found:', rows.length);
    if (rows.length > 0) {
        console.log('First row (sample):', rows[0]);
        console.log('All rows:');
        rows.forEach((r, i) => console.log(`  [${i}]`, r.join(' | ')));
    }
    return rows;
}

async function testESPNRecordsPage(venueName) {
    // The URL from the screenshot: espncricinfo.com/records/opposition/team-results-summary/india-6/...
    // Try the venue records page directly
    const slug = venueName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const url = `https://www.espncricinfo.com/records/ground/${slug}`;
    console.log('\n📊 Testing ESPN Records page for:', venueName);
    console.log('URL:', url);
    
    try {
        const { data } = await axios.get(url, { headers: ESPN_HEADERS, timeout: 15000 });
        const $ = cheerio.load(data);
        
        // Look for any stats tables or JSON data
        const scripts = [];
        $('script[type="application/json"]').each((i, el) => {
            scripts.push($(el).text().substring(0, 200));
        });
        
        console.log('JSON scripts found:', scripts.length);
        if (scripts.length > 0) console.log('First script preview:', scripts[0]);
        
        // Check page title
        console.log('Page title:', $('title').text());
    } catch(e) {
        console.log('Error:', e.message);
    }
}

async function testWikipediaStadiumImage(stadiumName) {
    console.log('\n🖼️ Testing Wikipedia image for:', stadiumName);
    
    // Method 1: Wikipedia page images API
    const r = await axios.get(`https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(stadiumName)}&prop=pageimages&format=json&pithumbsize=500&pilicense=any`, {
        headers: { 'User-Agent': 'SportBuzz/1.0 (contact@sportbuzz.app)' }
    });
    
    const pages = r.data.query.pages;
    const pageId = Object.keys(pages)[0];
    const page = pages[pageId];
    
    console.log('Page title:', page.title);
    console.log('Image URL:', page.thumbnail?.source || 'No image found');
    return page.thumbnail?.source || null;
}

async function main() {
    console.log('='.repeat(60));
    console.log('TESTING ESPNCRICINFO + WIKIPEDIA FOR VENUE DATA');
    console.log('='.repeat(60));
    
    // Test StatGuru with Wankhede
    await testStatGuruVenueStats('Wankhede Stadium, Mumbai');
    
    // Test StatGuru with Eden Gardens
    await testStatGuruVenueStats('Eden Gardens, Kolkata');
    
    // Test Wikipedia images
    await testWikipediaStadiumImage('Wankhede Stadium');
    await testWikipediaStadiumImage('Eden Gardens');
    await testWikipediaStadiumImage('M. Chinnaswamy Stadium');
    await testWikipediaStadiumImage('Narendra Modi Stadium');
}

main().catch(console.error);
