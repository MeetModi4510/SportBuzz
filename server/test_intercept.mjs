import puppeteer from 'puppeteer';

async function interceptRequests() {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36');
    
    page.on('response', async response => {
        const url = response.url();
        if (url.includes('api') || url.includes('json') || url.includes('commentary')) {
            console.log('Intercepted response:', url);
            try {
                const text = await response.text();
                if (text.includes('commText') || text.includes('overNum')) {
                    console.log('--- FOUND BALL DATA IN:', url, '---');
                }
            } catch(e) {}
        }
    });

    await page.goto('https://www.cricbuzz.com/cricket-full-commentary/148404/ind-vs-afg-2nd-odi-afghanistan-tour-of-india-2026/1', { waitUntil: 'networkidle2' });
    
    await browser.close();
}
interceptRequests();
