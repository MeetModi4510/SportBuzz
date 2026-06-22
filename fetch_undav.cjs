const axios = require('axios');
const fs = require('fs');
axios.get('https://www.fotmob.com/players/273300/player', {
    headers: { 'User-Agent': 'Mozilla/5.0' }
}).then(r => {
    const match = r.data.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
    if (match) {
        fs.writeFileSync('undav_next_data.json', match[1]);
        console.log('Saved to undav_next_data.json');
    } else {
        console.log('No NEXT_DATA found');
    }
}).catch(console.error);
