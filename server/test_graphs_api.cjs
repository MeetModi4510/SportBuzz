const axios = require('axios');
const matchId = '129563';

async function testApi(endpoint) {
    try {
        const res = await axios.get(`https://www.cricbuzz.com/api/cricket-match/${endpoint}/${matchId}`, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        console.log(`Endpoint ${endpoint} returned Status: ${res.status}, Length: ${res.data.length}`);
    } catch(e) {
        console.log(`Endpoint ${endpoint} failed: ${e.response ? e.response.status : e.message}`);
    }
}

async function testMcenter(endpoint) {
    try {
        const res = await axios.get(`https://m.cricbuzz.com/mcenter/v1/${matchId}/${endpoint}`, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        console.log(`Mcenter ${endpoint} returned Status: ${res.status}, Length: ${res.data.length ? res.data.length : JSON.stringify(res.data).length}`);
    } catch(e) {
        console.log(`Mcenter ${endpoint} failed: ${e.response ? e.response.status : e.message}`);
    }
}

(async () => {
    await testApi('graphs');
    await testApi('partnerships');
    await testApi('win-probability');
    
    await testMcenter('graphs');
    await testMcenter('ball-map');
    await testMcenter('win-prob');
})();
