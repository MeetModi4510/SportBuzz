import fs from 'fs';
import axios from 'axios';

async function testSourceMaps() {
    try {
        const html = fs.readFileSync('cricbuzz_html_dump.html', 'utf8');
        
        // Find JS chunks
        const jsMatches = html.match(/\/_next\/static\/chunks\/[^"']+\.js/g);
        if (!jsMatches) {
            console.log("No JS chunks found.");
            return;
        }
        
        const uniqueJs = [...new Set(jsMatches)];
        console.log(`Found ${uniqueJs.length} unique JS chunks. Testing the first few for source maps...`);
        
        for (let i = 0; i < Math.min(5, uniqueJs.length); i++) {
            const jsUrl = `https://www.cricbuzz.com${uniqueJs[i]}`;
            const mapUrl = `${jsUrl}.map`;
            
            console.log(`\nChecking: ${mapUrl}`);
            try {
                const res = await axios.head(mapUrl, {
                    headers: { 'User-Agent': 'Mozilla/5.0' },
                    validateStatus: () => true
                });
                
                if (res.status === 200) {
                    console.log(`SUCCESS! Source map found for ${uniqueJs[i]}`);
                    console.log("This means Cricbuzz accidentally left source maps on!");
                    return;
                } else {
                    console.log(`Failed. Status: ${res.status}`);
                }
            } catch (err) {
                console.log(`Failed: ${err.message}`);
            }
        }
        console.log("\nConclusion: Source maps are disabled in production, as expected for enterprise sites.");
        
    } catch (e) {
        console.error(e);
    }
}

testSourceMaps();
