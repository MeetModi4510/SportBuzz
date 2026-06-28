const axios = require('axios');
const cp = require('child_process');

async function testAllMethods() {
    const targetUrl = 'https://www.espncricinfo.com/records/ground/team-highest-innings-totals/civil-service-cricket-club-stormont-belfast-1409/tests-1';
    
    console.log("=== METHOD 1: CURL (No Node.js TLS Fingerprint) ===");
    try {
        const cmd = `curl -s -o NUL -w "%{http_code}" -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" -H "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8" -H "Accept-Language: en-US,en;q=0.5" "${targetUrl}"`;
        const result = cp.execSync(cmd, { encoding: 'utf8' });
        console.log("cURL HTTP Status:", result.trim());
    } catch (e) {
        console.error("cURL failed:", e.message);
    }
    
    console.log("\n=== METHOD 2: Axios with Session Cookies ===");
    try {
        // Step 1: Visit homepage to get cookies
        const initialRes = await axios.get('https://www.espncricinfo.com/', {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const cookies = initialRes.headers['set-cookie'] ? initialRes.headers['set-cookie'].map(c => c.split(';')[0]).join('; ') : '';
        console.log("Got Cookies:", cookies.length > 0 ? "Yes" : "No");
        
        // Step 2: Request target endpoint
        const res = await axios.get(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Cookie': cookies,
                'Referer': 'https://www.espncricinfo.com/',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8'
            }
        });
        console.log("Axios Status:", res.status);
    } catch (e) {
        console.error("Axios blocked. Status:", e.response ? e.response.status : e.message);
    }

    console.log("\n=== METHOD 3: Native Fetch ===");
    try {
        const res = await fetch(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
            }
        });
        console.log("Fetch Status:", res.status);
    } catch (e) {
        console.error("Fetch failed:", e.message);
    }
}

testAllMethods();
