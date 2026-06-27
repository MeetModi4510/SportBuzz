import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());

async function searchVenueWithPuppeteer() {
    const venueName = "Wankhede Stadium";
    
    console.log(`Launching browser to search for ${venueName}...`);
    try {
        const browser = await puppeteer.launch({
            headless: "new",
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        const page = await browser.newPage();
        
        const query = encodeURIComponent(`site:cricbuzz.com/cricket-venue ${venueName}`);
        await page.goto(`https://www.google.com/search?q=${query}`, { waitUntil: 'networkidle2' });
        
        // Extract the first link
        const firstLink = await page.evaluate(() => {
            const anchor = document.querySelector('div.g a');
            return anchor ? anchor.href : null;
        });
        
        console.log("First Link:", firstLink);
        
        if (firstLink) {
            const match = firstLink.match(/cricket-venue\/(\d+)/);
            if (match) {
                console.log(`=> Found Cricbuzz Venue ID: ${match[1]}`);
            } else {
                console.log("=> Not a valid venue URL");
            }
        }
        
        await browser.close();
    } catch(e) {
        console.log("Error:", e.message);
    }
}
searchVenueWithPuppeteer();
