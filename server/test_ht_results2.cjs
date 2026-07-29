const axios = require('axios');
async function testHTResults() {
    try {
        const res = await axios.get('https://www.hindustantimes.com/cricket/match-results', {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
            timeout: 5000
        });
        console.log("HT Results found, length:", res.data.length);
    } catch(e) {
        console.log("HT Results Error:", e.message);
    }
}
testHTResults();
