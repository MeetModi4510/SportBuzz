const axios = require('axios');
const url = 'https://www.cricbuzz.com/live-cricket-full-commentary/129563/eng-vs-nz-2nd-test-new-zealand-tour-of-england-2026';

axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }).then(res => {
    const fs = require('fs');
    fs.writeFileSync('full_comm_html.txt', res.data);
    
    const txt = res.data;
    const match = txt.match(/NZ 1st Innings/gi);
    console.log('NZ 1st Innings found in HTML:', match ? match.length : 0);
}).catch(console.error);
