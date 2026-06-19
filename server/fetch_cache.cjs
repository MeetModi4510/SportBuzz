const axios = require('axios');
const fs = require('fs');

async function fetchCache() {
    try {
        const url = 'http://webcache.googleusercontent.com/search?q=cache:https://www.cricbuzz.com/live-cricket-full-commentary/129563/eng-vs-nz-2nd-test-new-zealand-tour-of-england-2026';
        const res = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } });
        fs.writeFileSync('cache.html', res.data);
        console.log('Saved Google cache HTML, length:', res.data.length);
    } catch(e) {
        console.error('Google cache failed:', e.message);
    }
}
fetchCache();
