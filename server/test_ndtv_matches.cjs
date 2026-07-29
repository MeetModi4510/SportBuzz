const axios = require('axios');
async function getMatches() {
    try {
        const res = await axios.get('https://sdata.ndtv.com/sportz/cricket/xml/FG/prod/matches.json');
        const matches = res.data;
        const keys = Object.keys(matches);
        const matchInfo = matches[keys[0]];
        console.log(matchInfo);
        
        // Find India vs England T20 match that just finished this month!
        let indEngMatch = null;
        for (const k of keys) {
            const m = matches[k];
            const t = JSON.stringify(m).toLowerCase();
            if (t.includes('india') && t.includes('england') && t.includes('t20')) {
                indEngMatch = { key: k, match: m };
                break;
            }
        }
        if (indEngMatch) {
            console.log("\nFound India vs England T20:", indEngMatch.key);
        } else {
            console.log("\nIndia vs England T20 not found in matches.json");
        }
    } catch(e) { console.error(e.message); }
}
getMatches();
