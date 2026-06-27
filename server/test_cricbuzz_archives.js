import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';

async function buildVenueIndex() {
    try {
        console.log("Scraping Cricbuzz Archives to build Venue Index...");
        const url = 'https://www.cricbuzz.com/cricket-scorecard-archives/2023';
        const res = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        const $ = cheerio.load(res.data);
        
        let matches = 0;
        // The archives page has links to series or matches
        $('a').each((i, el) => {
            const href = $(el).attr('href');
            if (href && href.includes('cricket-series/')) {
                matches++;
            }
        });
        
        console.log(`Found ${matches} series in 2023!`);
        
        // This would take too long to spider.
        console.log("We need a faster way to build the index.");
    } catch(e) {
        console.log("Error:", e.message);
    }
}
buildVenueIndex();
