const cheerio = require('cheerio');

async function testModernRecords() {
    try {
        const headers = { 
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Cache-Control': 'max-age=0'
        };
        
        console.log("Testing Recent Matches...");
        let res = await fetch('https://www.espncricinfo.com/records/ground/team-match-results/civil-service-cricket-club-stormont-belfast-1409/tests-1', { headers });
        let html = await res.text();
        console.log("Status:", res.status);
        if (res.status === 200) {
            const $ = cheerio.load(html);
            const nextData = $('#__NEXT_DATA__').html();
            if (nextData) {
                const json = JSON.parse(nextData);
                console.log("Data in matches:", Object.keys(json.props.appPageProps.data || {}));
                const records = json.props.appPageProps.data?.results?.results || [];
                console.log("Found", records.length, "matches");
                if (records.length > 0) {
                    console.log("Sample match:", records[0]);
                }
            } else {
                console.log("No NEXT_DATA found");
            }
        }
        
        console.log("\nTesting Highest Totals...");
        res = await fetch('https://www.espncricinfo.com/records/ground/team-highest-innings-totals/civil-service-cricket-club-stormont-belfast-1409/tests-1', { headers });
        html = await res.text();
        console.log("Status:", res.status);
        if (res.status === 200) {
            const $ = cheerio.load(html);
            const nextData = $('#__NEXT_DATA__').html();
            if (nextData) {
                const json = JSON.parse(nextData);
                const records = json.props.appPageProps.data?.results?.results || [];
                console.log("Found", records.length, "high totals");
                if (records.length > 0) {
                    console.log("Sample total:", records[0]);
                }
            }
        }
        
    } catch (e) {
        console.error("Error:", e.message);
    }
}

testModernRecords();
