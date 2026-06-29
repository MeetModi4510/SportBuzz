const axios = require('axios');
const cheerio = require('cheerio');

async function scrape() {
    try {
        const response = await axios.get('https://www.bdfutbol.com/en/s/2002.html', {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
        });
        console.log(response.data.substring(0, 1000));
        
        // I will write a quick file to inspect the DOM if needed.
        const fs = require('fs');
        fs.writeFileSync('bdfutbol.html', response.data);
        console.log('Saved bdfutbol.html');
    } catch (e) {
        console.error(e.message);
    }
}
scrape();
