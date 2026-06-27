import axios from 'axios';
import * as cheerio from 'cheerio';

async function testYahooSearch() {
    try {
        console.log("Scraping Yahoo Search...");
        const query = encodeURIComponent('site:cricbuzz.com/cricket-venue "Narendra Modi Stadium"');
        const url = `https://search.yahoo.com/search?p=${query}`;
        
        const res = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
            }
        });
        
        const $ = cheerio.load(res.data);
        let foundUrl = null;
        
        $('a').each((i, el) => {
            const href = $(el).attr('href');
            if (href && href.includes('cricbuzz.com/cricket-venue/')) {
                // Yahoo often wraps urls
                console.log("Raw href:", href);
                // Extract real url
                const match = href.match(/RU=(.+?)\/RK=2/);
                if (match) {
                    const decoded = decodeURIComponent(match[1]);
                    console.log("Decoded:", decoded);
                    if (!foundUrl) foundUrl = decoded;
                }
            }
        });
        
    } catch(e) {
        console.log("Error:", e.message);
    }
}
testYahooSearch();
