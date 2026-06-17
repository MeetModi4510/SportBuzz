import puppeteer from 'puppeteer';

async function testCricbuzzNetwork() {
    console.log("=== TESTING STRATEGIES 1 & 2 VIA NETWORK INTERCEPTION ===");
    let browser;
    try {
        browser = await puppeteer.launch({ headless: 'new' });
        const page = await browser.newPage();
        
        // Listen to all network requests
        const requests = [];
        page.on('request', request => {
            const url = request.url();
            const type = request.resourceType();
            
            // Filter out images, fonts, css to keep noise down
            if (['fetch', 'xhr', 'websocket', 'eventsource'].includes(type)) {
                requests.push({ url, type });
            }
        });

        console.log("Navigating to live match page...");
        await page.goto('https://www.cricbuzz.com/live-cricket-scores/148404', { waitUntil: 'networkidle2', timeout: 30000 });
        
        console.log("Page loaded. Waiting 10 seconds to catch polling or sockets...");
        await new Promise(r => setTimeout(r, 10000));
        
        console.log("\n--- Background Network Activity Detected ---");
        
        const websockets = requests.filter(r => r.type === 'websocket');
        const sse = requests.filter(r => r.type === 'eventsource');
        const fetchRequests = requests.filter(r => r.type === 'fetch' || r.type === 'xhr');
        
        console.log(`WebSockets: ${websockets.length}`);
        if (websockets.length > 0) console.log("WS URLs:", [...new Set(websockets.map(r => r.url))]);
        
        console.log(`Server-Sent Events: ${sse.length}`);
        if (sse.length > 0) console.log("SSE URLs:", [...new Set(sse.map(r => r.url))]);
        
        console.log(`Fetch/XHR Polling: ${fetchRequests.length}`);
        if (fetchRequests.length > 0) {
            // Find recurring requests
            const urlCounts = {};
            fetchRequests.forEach(r => {
                const base = r.url.split('?')[0];
                urlCounts[base] = (urlCounts[base] || 0) + 1;
            });
            console.log("Polling Endpoints detected (>1 request to same base URL):");
            Object.keys(urlCounts).forEach(url => {
                if (urlCounts[url] > 1) {
                    console.log(`- ${url} (${urlCounts[url]} times)`);
                }
            });
            // Print a sample of XHRs
            console.log("\nSample XHR URLs:");
            [...new Set(fetchRequests.map(r => r.url))].slice(0, 5).forEach(u => console.log(u));
        }

    } catch(e) {
        console.error("Puppeteer Failed:", e.message);
    } finally {
        if (browser) await browser.close();
    }
}

testCricbuzzNetwork();
