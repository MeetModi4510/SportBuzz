const axios = require('axios');

async function checkNDTVHtml() {
    try {
        const res = await axios.get('https://sports.ndtv.com/cricket/live-scores', {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
        });
        
        const html = res.data;
        // Search for json or api endpoints
        const urls = html.match(/https?:\/\/[^\s"'<>]*(api|\.json)[^\s"'<>]*/gi) || [];
        const uniqueUrls = [...new Set(urls)];
        console.log("Found API/JSON URLs on NDTV:");
        console.log(uniqueUrls.slice(0, 30).join('\n'));
        
    } catch (e) {
        console.error("Error:", e.message);
    }
}
checkNDTVHtml();
