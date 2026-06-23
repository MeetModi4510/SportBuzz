const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function test() {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    
    page.on('response', async (response) => {
        const url = response.url();
        if (url.includes('transfers')) {
            try {
                if (response.headers()['content-type']?.includes('application/json')) {
                    const data = await response.json();
                    console.log("JSON API FOUND:", url);
                    console.log("Keys:", Object.keys(data));
                    if (data.transfers) {
                        console.log("Transfers:", data.transfers.length);
                        process.exit(0);
                    }
                }
            } catch (e) {}
        }
    });

    await page.goto('https://www.fotmob.com/transfers', { waitUntil: 'networkidle2' });
    
    // Evaluate the DOM to see if transfers are rendered in HTML
    const htmlText = await page.evaluate(() => document.body.innerText);
    console.log("DOM text preview:", htmlText.substring(0, 500).replace(/\n/g, ' '));
    
    await browser.close();
}

test();
