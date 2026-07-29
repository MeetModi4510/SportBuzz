const axios = require('axios');
async function testCrossCDN() {
    try {
        const id = '264919'; // NDTV's Eng vs Ind ODI match ID
        const url = `https://www.hindustantimes.com/static-content/10s/commentary_${id}_1.json`;
        const res = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }});
        console.log(`SUCCESS! Found ${res.data.commentary?.length} balls on HT CDN using NDTV ID!`);
    } catch(e) {
        console.log("FAILED:", e.message);
    }
}
testCrossCDN();
