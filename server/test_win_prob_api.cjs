const axios = require('axios');

async function testApi(endpoint) {
    try {
        const url = `https://www.cricbuzz.com/api/mcenter/${endpoint}/129563`;
        const res = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        console.log(`Endpoint ${endpoint}: Status 200, length: ${JSON.stringify(res.data).length}`);
    } catch(e) {
        console.error(`Endpoint ${endpoint} failed: ${e.response ? e.response.status : e.message}`);
    }
}

(async () => {
    await testApi('win-probability');
    await testApi('win-prob');
    await testApi('predictor');
    await testApi('match-predictor');
    await testApi('match-win-probability');
})();
