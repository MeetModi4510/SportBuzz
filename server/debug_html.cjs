const axios = require('axios');
async function test() {
    const r = await axios.get('https://www.cricbuzz.com/live-cricket-full-commentary/129480/eng-vs-ind');
    const cheerio = await import('cheerio');
    const $ = cheerio.load(r.data);
    let c = 0;
    $('div.font-bold').each((i, el) => {
        if (/^\d+\.\d+$/.test($(el).text().trim())) c++;
    });
    console.log('Parsed balls:', c);
}
test();
