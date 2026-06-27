import axios from 'axios';
import * as cheerio from 'cheerio';

async function findCricbuzzSearch() {
    try {
        console.log("Fetching Cricbuzz homepage...");
        const res = await axios.get('https://www.cricbuzz.com', {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        
        const $ = cheerio.load(res.data);
        
        // Let's find the search form
        const form = $('form[action*="search"]');
        console.log("Form action:", form.attr('action'));
        
        // Let's find any inputs related to search
        const searchInput = $('input[name="search"]');
        console.log("Search input name:", searchInput.attr('name'));
        
        // Let's print out all JS files to see if one is related to search
        $('script').each((i, el) => {
            const src = $(el).attr('src');
            if (src && src.includes('search')) {
                console.log("JS File:", src);
            }
        });
        
        // Look through raw HTML for "autocomplete" or "search" endpoints
        const html = res.data;
        const matches = html.match(/https:\/\/[^"']*(search|autocomplete)[^"']*/g);
        if (matches) {
            console.log("Found endpoint strings:", matches);
        }
        
    } catch(e) {
        console.log("Error:", e.message);
    }
}
findCricbuzzSearch();
