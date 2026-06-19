const axios = require('axios');
const cheerio = require('cheerio');

axios.get('https://m.cricbuzz.com/profiles/8502/player', {
    headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1'
    }
}).then(res => {
    const $ = cheerio.load(res.data);
    let found = false;
    $('div').each((_, el) => {
        const text = $(el).text().trim();
        if(text.startsWith('Born') && text.length < 100) {
            console.log('BORN:', text);
            found = true;
        }
        if(text.startsWith('Role') && text.length < 100) {
            console.log('ROLE:', text);
            found = true;
        }
    });
    if(!found) {
        console.log("Not found using div. Let's dump the whole HTML structure briefly");
        console.log($('body').text().substring(0, 500));
    }
}).catch(e=>console.log(e.message));
