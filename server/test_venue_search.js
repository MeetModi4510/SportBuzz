import axios from 'axios';
import * as cheerio from 'cheerio';

async function testDDG() {
    const venues = ['Wankhede', 'Eden Gardens', 'Chinnaswamy', 'MCG', 'Lords'];
    
    for (const venue of venues) {
        try {
            const query = encodeURIComponent(`site:cricbuzz.com/cricket-venue ${venue}`);
            const ddgUrl = `https://html.duckduckgo.com/html/?q=${query}`;
            const ddgRes = await axios.get(ddgUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });
            
            const $ddg = cheerio.load(ddgRes.data);
            let venueUrl = null;
            $ddg('.result__url').each((i, el) => {
                const href = $ddg(el).text().trim();
                if (href.includes('cricbuzz.com/cricket-venue')) {
                    if (!venueUrl) venueUrl = href;
                }
            });
            
            if (venueUrl) {
                const idMatch = venueUrl.match(/cricket-venue\/(\d+)/);
                if (idMatch) {
                    console.log(`✓ ${venue}: ID ${idMatch[1]} (${venueUrl})`);
                } else {
                    console.log(`? ${venue}: Found URL but no ID (${venueUrl})`);
                }
            } else {
                console.log(`✗ ${venue}: Not found in DDG`);
            }
        } catch(e) {
            console.log(`Error for ${venue}:`, e.message);
        }
        // Small delay
        await new Promise(r => setTimeout(r, 1000));
    }
}
testDDG();
