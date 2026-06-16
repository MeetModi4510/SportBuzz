import axios from 'axios';
import * as cheerio from 'cheerio';

async function test() {
    try {
        const res = await axios.get('https://www.cricbuzz.com/cricket-team/india/2/players', {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
        });
        const $ = cheerio.load(res.data);
        const name = $('h1').text();
        console.log("SUCCESS AXIOS! Title:", name);
    } catch(e) { console.error("Axios Failed:", e.message); }
}
test();
