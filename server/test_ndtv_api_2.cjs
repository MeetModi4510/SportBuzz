const axios = require('axios');
const cheerio = require('cheerio');

async function test() {
    // 1. Get NDTV live scores page
    const res = await axios.get('https://sports.ndtv.com/cricket/live-scores', {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });
    
    // 2. Find a match link
    const $ = cheerio.load(res.data);
    let matchLink = null;
    $('a[href*="/cricket/"]').each((i, el) => {
        const href = $(el).attr('href');
        if (href && href.includes('-live-score')) {
            matchLink = href;
            return false;
        }
    });
    
    if (!matchLink) {
        console.log("No match link found.");
        return;
    }
    
    matchLink = matchLink.startsWith('http') ? matchLink : `https://sports.ndtv.com${matchLink}`;
    console.log("Checking match:", matchLink);
    
    // 3. Get the match page and look for API URLs
    const res2 = await axios.get(matchLink, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    });
    
    const html = res2.data;
    const urls = html.match(/https?:\/\/[^\s"'<>]*(api|json|commentary|match)[^\s"'<>]*/gi) || [];
    const unique = [...new Set(urls)];
    console.log("Found API/JSON/Commentary URLs on NDTV Match Page:");
    console.log(unique.filter(u => u.includes('commentary') || u.includes('json') || u.includes('api')).slice(0, 20).join('\n'));
}
test();
