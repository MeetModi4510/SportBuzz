const axios = require('axios');
const cheerio = require('cheerio');

async function test() {
    const { data } = await axios.get('https://www.cricbuzz.com/cricket-venues/14/eden-gardens', {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    const $ = cheerio.load(data);
    const match = data.match(/venueStats.*?(?=\}<\/script>)/s) || data.match(/window\.__INITIAL_STATE__\s*=\s*(.*?);/);
    if (match) {
        console.log("Found something!");
    } else {
        const parts = data.split('script');
        console.log(`Found ${parts.length} script tags`);
    }
}
test();
