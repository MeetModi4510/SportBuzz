// Deep test - use puppeteer stealth to intercept the XHR/fetch calls fotmob makes
// Actually, let's look at what's in the Puppeteer headless browser to find the actual API
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
puppeteer.use(StealthPlugin());

(async () => {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    
    // Intercept all API requests
    const apiCalls = [];
    page.on('request', req => {
        const url = req.url();
        if (url.includes('fotmob') && (url.includes('match') || url.includes('lineup'))) {
            apiCalls.push({ url, method: req.method() });
        }
    });
    
    page.on('response', async resp => {
        const url = resp.url();
        if (url.includes('fotmob') && url.includes('matchDetails')) {
            console.log('API response from:', url, '- Status:', resp.status());
            try {
                const json = await resp.json();
                if (json.content && json.content.lineup) {
                    console.log('GOT LINEUP! Player 1:', JSON.stringify(json.content.lineup.lineup[0].players[0][0], null, 2));
                }
            } catch(e) {}
        }
    });
    
    console.log('Navigating to fotmob match page...');
    await page.goto('https://www.fotmob.com/matches/spain-vs-saudi-arabia/1qq6ht#4667801:tab=lineup', { 
        waitUntil: 'networkidle2', 
        timeout: 45000 
    });
    
    console.log('\nAll fotmob API calls intercepted:');
    apiCalls.forEach(c => console.log(' -', c.method, c.url));
    
    await browser.close();
})();
