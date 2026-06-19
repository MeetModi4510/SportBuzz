const axios = require('axios');
const url = 'https://www.cricbuzz.com/cricket-match-facts/129563/match';
axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0', 'RSC': '1', 'x-nextjs-data': '1' } }).then(res => {
    const txt = res.data;
    
    // Attempt to extract all key-value pairs
    const regex = /"children":"([^"]+)"\}\]\,\["\$","div",null,\{"children":"([^"]+)"/g;
    let match;
    const extracted = {};
    while ((match = regex.exec(txt)) !== null) {
        extracted[match[1]] = match[2];
    }
    console.log("Extracted pairs:", Object.keys(extracted).length);
    console.log(extracted);
}).catch(console.error);
