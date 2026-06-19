const axios = require('axios');
const cheerio = require('cheerio');

axios.get('https://www.cricbuzz.com/profiles/8056/player', {
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
    }
}).then(res => {
    const $ = cheerio.load(res.data);
    console.log("Title:", $('title').text());
    console.log("H1:", $('h1').text());
    
    // Find personal info
    const info = {};
    $('.cb-player-name-wrap').parent().find('.text-gray').each((_, el) => {
        const key = $(el).text().trim();
        const val = $(el).next().text().trim();
        if(key) info[key] = val;
    });
    console.log("Info:", info);
    
    // find tables
    const tables = $('table');
    console.log("Tables:", tables.length);

}).catch(e => console.log(e.message));
