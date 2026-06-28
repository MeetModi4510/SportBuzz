const axios = require('axios');
const cheerio = require('cheerio');

// Test venues with their cricmetric venue names
const venues = [
    { name: 'Ahmedabad', format: 'Test' },
    { name: 'Eden Gardens', format: 'Test' },
    { name: 'Wankhede', format: 'Test' },
];

async function scrapeCricmetricVenue(venueName, format = 'Test') {
    const url = `https://www.cricmetric.com/venue.py?venue=${encodeURIComponent(venueName)}&format=${format}&category=Men`;
    console.log(`\n=== Fetching: ${url} ===`);
    
    try {
        const res = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Referer': 'https://www.cricmetric.com/',
            },
            timeout: 15000,
        });
        
        console.log(`Status: ${res.status}`);
        const $ = cheerio.load(res.data);
        
        // Extract Google Charts data from script tags
        const scriptContent = $('script').map((i, el) => $(el).html()).get().join('\n');
        
        // Extract key data
        const data = {};
        
        // 1. Average first innings score
        const avgScoreMatch = scriptContent.match(/avg_1st_score['":\s]*(\d+\.?\d*)/i);
        if (avgScoreMatch) data.avgFirstInnings = parseFloat(avgScoreMatch[1]);
        
        // 2. Match outcomes (win/loss/draw)
        const outcomeMatch = scriptContent.match(/\['Home Win',\s*(\d+)\].*?\['Away Win',\s*(\d+)\].*?\['Draw',\s*(\d+)\]/s);
        if (outcomeMatch) {
            data.homeWin = parseInt(outcomeMatch[1]);
            data.awayWin = parseInt(outcomeMatch[2]);
            data.draws = parseInt(outcomeMatch[3]);
        }
        
        // 3. Bowler types data
        const bowlerDataMatch = scriptContent.match(/drawChart_bowler_[A-Z]+\(\)[\s\S]*?data\.addRows\(\[([\s\S]*?)\]\)/);
        if (bowlerDataMatch) {
            console.log('Bowler data found!');
            data.bowlerData = bowlerDataMatch[1];
        }
        
        // Log all script content for analysis
        console.log('\n--- Script content (first 5000 chars) ---');
        console.log(scriptContent.substring(0, 5000));
        
        // Get all h4 headings to understand page structure
        console.log('\n--- Page sections ---');
        $('h4').each((i, el) => console.log($(el).text()));
        
        // Get all tables
        console.log('\n--- Tables found ---');
        $('table').each((i, table) => {
            console.log(`\nTable ${i + 1}:`);
            $(table).find('tr').slice(0, 5).each((j, row) => {
                const cells = $(row).find('td, th').map((k, cell) => $(cell).text().trim()).get();
                console.log('  ', cells.join(' | '));
            });
        });
        
        // Try to extract match count from text
        const bodyText = $('body').text();
        const matchCountMatch = bodyText.match(/(\d+)\s+matches?\s+played/i);
        if (matchCountMatch) data.totalMatches = parseInt(matchCountMatch[1]);
        
        console.log('\n--- Extracted data ---', data);
        return data;
    } catch (err) {
        console.error(`Error: ${err.message}`);
        if (err.response) {
            console.error(`Status: ${err.response.status}`);
            console.error(`Headers:`, err.response.headers);
        }
        return null;
    }
}

async function main() {
    for (const v of venues) {
        await scrapeCricmetricVenue(v.name, v.format);
        await new Promise(r => setTimeout(r, 2000));
    }
}

main();
