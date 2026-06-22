import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());

(async () => {
    try {
        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();
        await page.goto('https://www.fotmob.com/match/4667801', { waitUntil: 'networkidle2' });
        
        const content = await page.content();
        const scriptMatch = content.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
        
        if (scriptMatch) {
            const data = JSON.parse(scriptMatch[1]);
            const fb = data?.props?.pageProps?.fallback;
            const matchKey = Object.keys(fb || {}).find(k => k.includes('matchDetails'));
            if (matchKey && fb[matchKey]?.content) {
                console.log("Keys in content:", Object.keys(fb[matchKey].content));
            }
        }
        await browser.close();
    } catch (e) {
        console.error(e);
    }
})();
