import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import * as cheerio from 'cheerio';
import fs from 'fs';

puppeteer.use(StealthPlugin());

const players = {
    "Rohit Sharma": "/cricketers/rohit-sharma-34102",
    "Virat Kohli": "/cricketers/virat-kohli-253802",
    "Suryakumar Yadav": "/cricketers/suryakumar-yadav-446507",
    "Hardik Pandya": "/cricketers/hardik-pandya-625371",
    "KL Rahul": "/cricketers/kl-rahul-422108",
    "Shikhar Dhawan": "/cricketers/shikhar-dhawan-28235",
    "Arshdeep Singh": "/cricketers/arshdeep-singh-1125976",
    "Jasprit Bumrah": "/cricketers/jasprit-bumrah-625383",
    "Axar Patel": "/cricketers/axar-patel-554691",
    "Yuzvendra Chahal": "/cricketers/yuzvendra-chahal-430246",
    "Kuldeep Yadav": "/cricketers/kuldeep-yadav-559235",
    "Bhuvneshwar Kumar": "/cricketers/bhuvneshwar-kumar-326016",
    "Abhishek Sharma": "/cricketers/abhishek-sharma-1070183",
    "Shubman Gill": "/cricketers/shubman-gill-1070173",
    "Ruturaj Gaikwad": "/cricketers/ruturaj-gaikwad-1060380",
    "Deepak Chahar": "/cricketers/deepak-chahar-447261",
    "Varun Chakravarthy": "/cricketers/varun-chakravarthy-1132062"
};

async function generateCache() {
    const results = {};
    
    for (const [name, path] of Object.entries(players)) {
        console.log(`Scraping ${name}...`);
        
        const browser = await puppeteer.launch({
            headless: "new",
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        try {
            const page = await browser.newPage();
            const url = `https://www.espncricinfo.com${path}`;
            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
            const html = await page.content();
            const $ = cheerio.load(html);
            const ogImage = $('meta[property="og:image"]').attr('content');
            if (ogImage && ogImage.includes('img1.hscicdn.com')) {
                results[name] = ogImage;
                console.log(`✓ ${name}: ${ogImage}`);
            } else {
                console.log(`✗ ${name}: No valid image found`);
            }
        } catch(e) {
            console.log(`✗ ${name}: Error - ${e.message}`);
        } finally {
            await browser.close();
        }
        
        await new Promise(r => setTimeout(r, 2000));
    }
    
    fs.writeFileSync('C:\\Users\\PRANSHU PATEL\\OneDrive\\Desktop\\dev_scripts\\server\\espn_player_images.json', JSON.stringify(results, null, 2));
    console.log("Successfully saved to espn_player_images.json!");
}
generateCache();
