const axios = require('axios');
const cheerio = require('cheerio');

async function test() {
    try {
        const res = await axios.get('https://m.cricbuzz.com/cricket-team/india/2', { headers: { 'User-Agent': 'Mozilla/5.0' } });
        const $ = cheerio.load(res.data);
        const images = [];
        $('img').each((i, el) => {
            images.push($(el).attr('src'));
        });
        console.log("MOBILE IMAGES:", images);
    } catch(e) {
        console.log(e.message);
    }
}
test();
