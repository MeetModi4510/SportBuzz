const axios = require('axios');
async function test() {
    const r = await axios.get('https://www.cricbuzz.com/live-cricket-full-commentary/129480/eng-vs-ind');
    const cheerio = await import('cheerio');
    const $ = cheerio.load(r.data);
    
    // Find where the commentary is in the DOM
    // Let's print out the text of any p tags or divs that have class containing "comm" or similar
    let count = 0;
    $('p, div').each((i, el) => {
        const t = $(el).text().trim();
        if(t.includes('bowls to') || t.includes('out') || t.includes('runs')) {
            count++;
            if(count < 5) console.log('Match:', t.substring(0, 100));
        }
    });
    console.log('Total matches:', count);
}
test();
