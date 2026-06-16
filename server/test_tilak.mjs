import { connect } from 'puppeteer-real-browser';
import * as cheerio from 'cheerio';

async function test() {
    let browserInstance;
    try {
        const { browser, page } = await connect({
            headless: false,
            turnstile: true
        });
        browserInstance = browser;

        const profileUrl = 'https://www.cricbuzz.com/profiles/14504/tilak-varma';
        console.log('Visiting:', profileUrl);
        await page.goto(profileUrl, { waitUntil: 'networkidle2' });
        await new Promise(r => setTimeout(r, 1500));
        const html = await page.content();
        const $ = cheerio.load(html);
        
        let photo = '';
        $('img').each((i, el) => {
            const src = $(el).attr('src');
            const title = $(el).attr('title');
            
            // Print all images to see what's there
            if (src && !src.includes('data:image')) {
                console.log('IMG:', src, 'TITLE:', title);
                if (src.includes('tilak-varma') || (title && title.includes('Profile Photo'))) {
                    photo = src;
                }
            }
        });
        
        console.log('\n--- EXTRACTED TILAK VARMA PHOTO ---');
        console.log(photo);

    } catch (e) {
        console.error('Error:', e.message);
    } finally {
        if (browserInstance) {
            await browserInstance.close();
            process.exit(0);
        }
    }
}
test();
