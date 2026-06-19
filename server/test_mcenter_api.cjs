const axios = require('axios');

async function testApi() {
    try {
        const url = 'https://www.cricbuzz.com/api/mcenter/balls-map/129563/3';
        const res = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        console.log('Status:', res.status);
        console.log('Data sample:', JSON.stringify(res.data).substring(0, 200));
    } catch(e) {
        console.error('API failed:', e.response ? e.response.status : e.message);
    }
}
testApi();
