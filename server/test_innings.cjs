const axios = require('axios');

async function checkInnings(inningsId) {
    try {
        const url = `https://www.cricbuzz.com/live-cricket-full-commentary/129563/match/${inningsId}`;
        const res = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        console.log(`Innings ${inningsId} URL returned status ${res.status}. Length: ${res.data.length}`);
    } catch(e) {
        console.log(`Innings ${inningsId} URL failed:`, e.response ? e.response.status : e.message);
    }
}

checkInnings(1);
checkInnings(2);
