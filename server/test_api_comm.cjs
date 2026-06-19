const axios = require('axios');
const matchId = '129563';

async function testApi() {
    try {
        const url = `https://www.cricbuzz.com/api/cricket-match/commentary/${matchId}`;
        const res = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        console.log('Status:', res.status);
        console.log('Data keys:', Object.keys(res.data));
    } catch(e) {
        console.error(e.message);
    }
}
testApi();
