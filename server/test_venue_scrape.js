import axios from 'axios';
import * as cheerio from 'cheerio';

async function testCricbuzzVenueSearch() {
    const venueName = "Wankhede Stadium";
    
    // 1. Try Cricbuzz Search API or Web Search
    try {
        console.log(`Searching for: ${venueName}`);
        
        // Let's use RapidAPI Cricbuzz search
        const searchUrl = `https://cricbuzz-cricket.p.rapidapi.com/stats/v1/venue/search?venueN=${encodeURIComponent(venueName)}`;
        // Wait, does the cricbuzz rapidapi have a venue search? Let's check!
        // We will just try a Google Dork via a simple request, or try Cricbuzz directly.
        // Actually, let's just scrape the Google Search result
        const googleUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent('site:cricbuzz.com/cricket-scores/venue "Wankhede Stadium"')}`;
        const ddgRes = await axios.get(googleUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
            }
        });
        
        const $ddg = cheerio.load(ddgRes.data);
        let venueUrl = null;
        $ddg('.result__url').each((i, el) => {
            const href = $ddg(el).text().trim();
            if (href.includes('cricbuzz.com/cricket-scores/venue') || href.includes('cricbuzz.com/cricket-venue')) {
                if (!venueUrl) venueUrl = 'https://' + href.replace('https://', '').trim();
            }
        });
        
        console.log("Found Venue URL:", venueUrl);
        
        if (venueUrl) {
            // Let's fetch the venue page
            const venueRes = await axios.get(venueUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0'
                }
            });
            const $ = cheerio.load(venueRes.data);
            
            console.log("Page Title:", $('title').text());
            
            // Look for deep stats
            const stats = {};
            // Let's print out all the text in the stats section to see what we can parse
            $('div.cb-col.cb-col-100').each((i, el) => {
                const text = $(el).text();
                if (text.includes('Highest Total') || text.includes('Win %') || text.includes('Average')) {
                    console.log("Found stats block:", text.substring(0, 200).replace(/\s+/g, ' '));
                }
            });
        }
        
    } catch(e) {
        console.log("Error:", e.message);
    }
}
testCricbuzzVenueSearch();
