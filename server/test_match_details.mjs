import axios from 'axios';

async function testMatchDetails() {
    const matchId = 148404;
    // Notice how we don't even need the full long URL name, just the ID and a dummy string usually works!
    // But let's use the exact URL provided by the user.
    const url = `https://www.cricbuzz.com/live-cricket-scores/148404/ind-vs-afg-2nd-odi-afghanistan-tour-of-india-2026`;
    
    console.log(`\n=== TESTING MATCH DETAILS SCRAPING ===`);
    try {
        const res = await axios.get(url, {
            headers: { 
                'User-Agent': 'Mozilla/5.0',
                'RSC': '1',
                'x-nextjs-data': '1'
            }
        });
        
        const dataStr = typeof res.data === 'string' ? res.data : JSON.stringify(res.data);
        console.log(`Fetched payload length: ${dataStr.length}`);
        
        // Let's check what data is in here
        if (dataStr.includes('matchScoreDetails')) {
            console.log("SUCCESS! Found 'matchScoreDetails' in the payload.");
        }
        if (dataStr.includes('commentaryList')) {
            console.log("SUCCESS! Found 'commentaryList' in the payload.");
        }
        if (dataStr.includes('scoreCard')) {
            console.log("SUCCESS! Found 'scoreCard' in the payload.");
        }
        
        // Dump a tiny snippet to prove we have the deep data
        const idx = dataStr.indexOf('"matchScoreDetails"');
        if (idx > -1) {
            console.log("\nSnippet of deep match data:");
            console.log(dataStr.substring(idx, idx + 250));
        }
        
    } catch(e) {
        console.log("Failed:", e.message);
    }
}

testMatchDetails();
