import axios from 'axios';
import * as cheerio from 'cheerio';

async function testCricbuzzVenuesScrape() {
    try {
        console.log("Testing Cricbuzz Venues index page...");
        // Let's try different possible URLs
        const urls = [
            'https://www.cricbuzz.com/cricket-venues',
            'https://www.cricbuzz.com/cricket-team/india/2/venues',
            'https://www.cricbuzz.com/cricket-series/6732/icc-cricket-world-cup-2023/venues'
        ];
        
        for (const url of urls) {
            try {
                console.log(`\nFetching: ${url}`);
                const res = await axios.get(url, {
                    headers: { 'User-Agent': 'Mozilla/5.0' }
                });
                console.log(`Status: ${res.status}`);
                const $ = cheerio.load(res.data);
                console.log(`Title: ${$('title').text()}`);
                
                // Print a few links to see if they are venue links
                let foundVenues = 0;
                $('a').each((i, el) => {
                    const href = $(el).attr('href');
                    if (href && href.includes('cricket-venue/')) {
                        if (foundVenues < 5) console.log(`Found venue link: ${href}`);
                        foundVenues++;
                    }
                });
                console.log(`Total venue links found: ${foundVenues}`);
            } catch(e) {
                console.log(`Failed: ${e.message}`);
            }
        }
    } catch(e) {
        console.log("Error:", e.message);
    }
}
testCricbuzzVenuesScrape();
