import axios from 'axios';
import * as cheerio from 'cheerio';

async function testBingSearch() {
    try {
        console.log("Scraping Bing...");
        const query = encodeURIComponent('site:cricbuzz.com/cricket-venue "Wankhede Stadium"');
        const url = `https://www.bing.com/search?q=${query}`;
        
        const res = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
            }
        });
        
        const $ = cheerio.load(res.data);
        let foundUrl = null;
        
        // Bing usually has results in <h2><a> or <cite>
        $('a').each((i, el) => {
            const href = $(el).attr('href');
            if (href && href.includes('cricbuzz.com/cricket-venue/')) {
                if (!foundUrl) foundUrl = href;
            }
        });
        
        console.log("Found URL:", foundUrl);
        if (foundUrl) {
            const match = foundUrl.match(/cricket-venue\/(\d+)/);
            if (match) console.log("ID:", match[1]);
        }
    } catch(e) {
        console.log("Error:", e.message);
    }
}
testBingSearch();
