import axios from 'axios';
import * as cheerio from 'cheerio';

async function testDDGLite() {
    try {
        console.log("Scraping DDG Lite...");
        const query = encodeURIComponent('site:cricbuzz.com/cricket-venue "Wankhede Stadium"');
        const url = `https://lite.duckduckgo.com/lite/`;
        
        // lite.duckduckgo.com requires POST for search
        const res = await axios.post(url, `q=${query}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
        
        const $ = cheerio.load(res.data);
        let foundUrl = null;
        
        $('a.result-url').each((i, el) => {
            const href = $(el).text().trim();
            if (href && href.includes('cricbuzz.com/cricket-venue/')) {
                foundUrl = href;
                console.log("Found URL:", foundUrl);
            }
        });
        
    } catch(e) {
        console.log("Error:", e.message);
    }
}
testDDGLite();
