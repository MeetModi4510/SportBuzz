import axios from 'axios';
import * as cheerio from 'cheerio';

async function testSportsDBScrape() {
    try {
        const country = 'India';
        console.log(`Scraping TheSportsDB for venues in ${country}...`);
        
        // TheSportsDB has a browse/search feature. Let's see if we can find it.
        // Actually, TheSportsDB has a search page: https://www.thesportsdb.com/search.php?s=venues&c=India
        // Or maybe https://www.thesportsdb.com/browse.php?c=India
        
        // Let's try searching their API first for the free tier? The user said "sportsdb webscraping".
        // Let's scrape the actual website search results.
        const url = `https://www.thesportsdb.com/search.php?s=venue&c=${country}`;
        const res = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
            }
        });
        
        const $ = cheerio.load(res.data);
        const text = $('body').text();
        console.log("Page text snippet:", text.substring(0, 500).replace(/\s+/g, ' '));
        
        // Find venues
        const venues = [];
        // Typically they might be in table rows or divs
        $('a').each((i, el) => {
            const href = $(el).attr('href');
            if (href && href.includes('venue')) {
                console.log("Found Venue link:", href, $(el).text().trim());
            }
        });
        
    } catch(e) {
        console.log("Error:", e.message);
    }
}
testSportsDBScrape();
