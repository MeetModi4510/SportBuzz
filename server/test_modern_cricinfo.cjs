const cheerio = require('cheerio');

async function testModernScraping() {
    try {
        const headers = { 
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Cache-Control': 'max-age=0'
        };
        
        console.log("1. Testing Grounds List...");
        let res = await fetch('https://www.espncricinfo.com/cricket-grounds/country/india-6', { headers });
        let html = await res.text();
        console.log("Status:", res.status);
        if (res.status === 200) {
            const $1 = cheerio.load(html);
            console.log("Grounds List __NEXT_DATA__ found. Length:", $1('#__NEXT_DATA__').html()?.length);
        }
        
        console.log("\n2. Testing Ground Records...");
        res = await fetch('https://www.espncricinfo.com/cricket-grounds/ma-chidambaram-stadium-chepauk-chennai-58008/records', { headers });
        html = await res.text();
        console.log("Status:", res.status);
        if (res.status === 200) {
            const $3 = cheerio.load(html);
            const nextData = $3('#__NEXT_DATA__').html();
            if (nextData) {
                console.log("Records __NEXT_DATA__ Length:", nextData.length);
                const json = JSON.parse(nextData);
                console.log("Root Keys:", Object.keys(json));
                if (json.props) console.log("Props Keys:", Object.keys(json.props));
                if (json.props && json.props.appPageProps) console.log("appPageProps Keys:", Object.keys(json.props.appPageProps));
                
                // dump it to a file
                const fs = require('fs');
                fs.writeFileSync('records_next_data.json', JSON.stringify(json, null, 2));
                console.log("Saved to records_next_data.json");
            }
        }
    } catch (e) {
        console.error("Error:", e.message);
    }
}

testModernScraping();
