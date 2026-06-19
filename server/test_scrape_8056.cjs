const axios = require('axios');
const cheerio = require('cheerio');

axios.get('https://m.cricbuzz.com/profiles/8056/player', {
    headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1'
    }
}).then(res => {
    const $ = cheerio.load(res.data);
    console.log("Name:", $('h1').text().trim());
    
    console.log("Dumping body text:");
    console.log($('body').text().substring(0, 1000));
}).catch(e => console.log(e.message));
