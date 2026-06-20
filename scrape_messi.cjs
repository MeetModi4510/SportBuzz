const puppeteer = require('puppeteer');

(async () => {
    console.log('Launching browser...');
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    
    // Set a realistic User-Agent
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    console.log('Navigating to Sofascore...');
    await page.goto('https://www.sofascore.com/football/player/lionel-messi/12994', {
        waitUntil: 'networkidle2',
        timeout: 30000
    });

    const nextData = await page.evaluate(() => {
        const el = document.getElementById('__NEXT_DATA__');
        return el ? el.innerHTML : null;
    });
    
    if (nextData) {
        console.log('\n--- __NEXT_DATA__ extracted ---');
        const data = JSON.parse(nextData);
        const playerInfo = data?.props?.pageProps?.initialFallback?.['/api/v1/player/12994'] || data?.props?.pageProps?.player;
        if (playerInfo) {
            console.log(JSON.stringify(playerInfo, null, 2));
        } else {
            console.log("Could not find player info in NEXT_DATA. Dumping keys:");
            console.log(Object.keys(data?.props?.pageProps || {}));
        }
    } else {
        console.log('\nFailed to extract __NEXT_DATA__.');
    }
    
    await browser.close();
})();
