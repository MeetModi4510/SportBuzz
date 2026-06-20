const fs = require('fs');
const axios = require('axios');

async function getH2H() {
    try {
        const res = await axios.get('https://www.cricbuzz.com/cricket-team/india/2/results');
        const m = res.data.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/);
        if (m) {
            const data = JSON.parse(m[1]);
            fs.writeFileSync('next.json', JSON.stringify(data, null, 2));
            console.log('Saved JSON');
        }
    } catch(e) { console.error(e); }
}

getH2H();
