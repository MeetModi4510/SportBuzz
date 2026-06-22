import { connect } from 'puppeteer-real-browser';
(async () => {
    try {
        const { page, browser } = await connect({
            headless: true,
            turnstile: true
        });
        await page.goto('https://www.fotmob.com/api/searchData?term=spain', { waitUntil: 'networkidle2' });
        const text = await page.evaluate(() => document.body.innerText);
        console.log(text.substring(0, 500));
        await browser.close();
    } catch (e) {
        console.error(e);
    }
})();
