import axios from 'axios';
import * as cheerio from 'cheerio';

async function testWikiLinks() {
    try {
        const url = 'https://en.wikipedia.org/wiki/Wankhede_Stadium';
        const res = await axios.get(url);
        const $ = cheerio.load(res.data);
        
        // Look for external links to cricinfo
        $('a.external').each((i, el) => {
            const href = $(el).attr('href');
            if (href && href.includes('cricinfo.com')) {
                console.log("Found Cricinfo Link:", href);
            }
            if (href && href.includes('cricbuzz.com')) {
                console.log("Found Cricbuzz Link:", href);
            }
        });
    } catch(e) {
        console.log("Error:", e.message);
    }
}
testWikiLinks();
