import axios from 'axios';

async function dumpRsc(url) {
    console.log(`\n=== DUMPING RSC FOR ${url} ===`);
    try {
        const res = await axios.get(url, {
            headers: { 
                'User-Agent': 'Mozilla/5.0',
                'RSC': '1',
                'x-nextjs-data': '1'
            }
        });
        
        const dataStr = typeof res.data === 'string' ? res.data : JSON.stringify(res.data);
        console.log("Length:", dataStr.length);
        
        const idx = dataStr.indexOf('typeMatches');
        if (idx > -1) {
            console.log("FOUND typeMatches!");
            console.log(dataStr.substring(idx, idx + 300));
        } else {
            console.log("Did not find typeMatches. Raw start:");
            console.log(dataStr.substring(0, 300));
        }
    } catch(e) {
        console.log("Error:", e.message);
    }
}

async function run() {
    await dumpRsc('https://www.cricbuzz.com/cricket-match/live-scores/recent-matches');
    await dumpRsc('https://www.cricbuzz.com/cricket-match/live-scores/upcoming-matches');
}
run();
