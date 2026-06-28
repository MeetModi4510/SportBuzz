const axios = require('axios');
const cheerio = require('cheerio');

async function run() {
    try {
        console.log("Fetching Cricmetric for Narendra Modi Stadium...");
        const url = 'https://www.cricmetric.com/sage/?q=narendra+modi+stadium';
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        
        const $ = cheerio.load(response.data);
        
        // Let's dump all text from any tables or major divs
        console.log("--- Extracting Data ---");
        $('.sage-results .sage-result').each((i, el) => {
            console.log(`\nResult ${i + 1}:`);
            console.log($(el).text().replace(/\s+/g, ' ').trim());
        });
        
        // Look for tables
        $('table').each((i, el) => {
            console.log(`\nTable ${i + 1}:`);
            const rows = $(el).find('tr');
            rows.each((j, row) => {
                console.log($(row).text().replace(/\s+/g, ' ').trim());
            });
        });

        // Any specific deep stats text?
        const fullText = $('body').text().replace(/\s+/g, ' ');
        if (fullText.toLowerCase().includes('highest')) {
            console.log("\nFound 'highest' in body text.");
        }
        
    } catch(e) {
        console.error("Failed to fetch:", e.message);
        if (e.response) {
            console.error("Status:", e.response.status);
            console.error("Headers:", e.response.headers);
        }
    }
}
run();
