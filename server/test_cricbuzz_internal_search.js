import axios from 'axios';
import * as cheerio from 'cheerio';

async function testCricbuzzInternalSearch() {
    try {
        console.log("Searching Cricbuzz directly...");
        const query = encodeURIComponent('Wankhede');
        
        // Cricbuzz doesn't have a simple GET /search page that works without JS sometimes, let's try
        const url = `https://www.cricbuzz.com/search?q=${query}`;
        // Let's also check if they have a /api/search
        
        // What if we just hit /cricket-venue/37/wankhede-stadium? 
        // Let's see if we can find the search API in the network tab of cricbuzz.com
        
        // Using axios to fetch the main search page
        const res = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        
        const $ = cheerio.load(res.data);
        console.log("Title:", $('title').text());
        
        let foundUrl = null;
        $('a').each((i, el) => {
            const href = $(el).attr('href');
            if (href && href.includes('cricket-venue/')) {
                console.log("Found Venue Link:", href);
                foundUrl = href;
            }
        });
        
    } catch(e) {
        console.log("Error:", e.message);
    }
}
testCricbuzzInternalSearch();
