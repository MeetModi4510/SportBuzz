const axios = require('axios');
const url = 'https://www.cricbuzz.com/cricket-match-facts/129563/match';
axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0', 'RSC': '1', 'x-nextjs-data': '1' } }).then(res => {
    const txt = res.data;
    const extract = (key) => {
        const regex = new RegExp(`"children":"${key}"\\}\\],\\["\\$","div",null,\\{"children":"([^"]+)"`);
        const match = txt.match(regex);
        return match ? match[1] : null;
    };
    console.log('Umpires:', extract('Umpires'));
    console.log('Referee:', extract('Referee'));
    console.log('TV:', extract('TV'));
    console.log('Streaming:', extract('Streaming'));
}).catch(console.error);
