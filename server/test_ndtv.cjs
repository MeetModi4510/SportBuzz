const axios = require('axios');
const cheerio = require('cheerio');

async function checkNDTV() {
    try {
        const res = await axios.get('https://sports.ndtv.com/cricket/live-scores', {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
        });
        
        const $ = cheerio.load(res.data);
        const links = [];
        $('a[href*="/cricket/"]').each((i, el) => {
            const href = $(el).attr('href');
            if (href && (href.includes('live-score') || href.includes('commentary') || href.includes('match'))) {
                const text = $(el).text().trim().replace(/\s+/g, ' ');
                if (text && text.length > 5) {
                    links.push({ href, text: text.substring(0, 100) });
                }
            }
        });
        
        console.log("Found matches matching 'India' or 'Lanka':");
        const indMatches = links.filter(l => l.text.toLowerCase().includes('india') || l.text.toLowerCase().includes('lanka'));
        if (indMatches.length > 0) {
            console.log(indMatches);
        } else {
            console.log("None found matching India/Lanka, here are the first 10:");
            console.log(links.slice(0, 10));
        }
        
    } catch (e) {
        console.error("Error:", e.message);
    }
}
checkNDTV();
