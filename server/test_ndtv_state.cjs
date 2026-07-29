const axios = require('axios');
const cheerio = require('cheerio');

async function checkNDTV() {
    try {
        const res = await axios.get('https://sports.ndtv.com/cricket/live-scores', {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
        });
        
        const html = res.data;
        // Search for __NEXT_DATA__ or similar JSON blocks
        let matchData = null;
        const scriptMatch = html.match(/<script.*?__NEXT_DATA__.*?>([\s\S]*?)<\/script>/);
        if (scriptMatch) {
            matchData = JSON.parse(scriptMatch[1]);
            console.log("Found Next.js data on NDTV!");
            console.log(Object.keys(matchData.props?.pageProps || {}));
        } else {
            console.log("No Next Data found on NDTV.");
            // check window.__PRELOADED_STATE__
            const preload = html.match(/window\.__PRELOADED_STATE__\s*=\s*({[\s\S]*?});/);
            if (preload) {
                console.log("Found Preloaded state!");
                matchData = JSON.parse(preload[1]);
            } else {
                console.log("No JSON state found.");
            }
        }
        
    } catch(e) { console.error(e.message); }
}
checkNDTV();
