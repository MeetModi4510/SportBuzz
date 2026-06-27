import axios from 'axios';
import * as cheerio from 'cheerio';

async function scrapeWikiVenues() {
    try {
        const url = 'https://en.wikipedia.org/wiki/List_of_cricket_grounds_in_India';
        console.log("Scraping Wikipedia...", url);
        const res = await axios.get(url);
        const $ = cheerio.load(res.data);
        
        const venues = [];
        // The international grounds are usually in the first few wikitable
        $('table.wikitable tbody tr').each((i, el) => {
            if (i === 0) return; // skip header
            const cols = $(el).find('td');
            if (cols.length >= 4) {
                const name = $(cols[0]).text().trim();
                const city = $(cols[1]).text().trim();
                const capacity = $(cols[2]).text().trim();
                
                if (name && !name.includes('Name')) {
                    venues.push({ name, city, capacity });
                }
            }
        });
        
        console.log(`Found ${venues.length} venues.`);
        console.log(venues.slice(0, 10));
    } catch(e) {
        console.log("Error:", e.message);
    }
}
scrapeWikiVenues();
