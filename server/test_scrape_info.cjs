const axios = require('axios');
const cheerio = require('cheerio');

axios.get('https://m.cricbuzz.com/profiles/9838/player', {
    headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1'
    }
}).then(res => {
    const $ = cheerio.load(res.data);
    const personalInfo = {};
    $('.cb-list-item').each((_, el) => {
        console.log("ITEM:", $(el).text().trim());
    });
    
    // If cb-list-item is empty, let's look for other classes or structures for personal info
    console.log("Looking for 'Born' or 'Role':");
    $('div').each((_, el) => {
        const text = $(el).text().trim();
        if (text.startsWith('Born') || text.startsWith('Role') || text.startsWith('Batting Style')) {
            console.log("FOUND:", text);
        }
    });

}).catch(e => console.log(e.message));
