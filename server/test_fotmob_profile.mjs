import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';

async function testFotmob() {
    try {
        const r = await axios.get('https://www.fotmob.com/players/30981/lionel-messi', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
            }
        });
        const $ = cheerio.load(r.data);
        const nextDataRaw = $('script#__NEXT_DATA__').html();
        if (!nextDataRaw) {
            console.log("No __NEXT_DATA__ found.");
            return;
        }
        
        const nextData = JSON.parse(nextDataRaw);
        
        // Save the parsed data to see what we can fetch
        fs.writeFileSync('fotmob_profile.json', JSON.stringify(nextData.props.pageProps, null, 2));
        console.log("Successfully extracted FotMob profile JSON data!");
        console.log("Top-level keys in pageProps:", Object.keys(nextData.props.pageProps));
        
        if (nextData.props.pageProps.fallback) {
            console.log("Fallback keys:", Object.keys(nextData.props.pageProps.fallback));
        }
    } catch(e) {
        console.error(e.message);
    }
}
testFotmob();
