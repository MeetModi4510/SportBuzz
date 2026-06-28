const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());
const cheerio = require('cheerio');

async function scrapeStatGuruDeepStats(groundId, classId) {
    console.log(`\n--- Fetching Deep Stats for Ground: ${groundId}, Class: ${classId} ---`);
    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
    const page = await browser.newPage();
    
    try {
        // 1. Highest Team Totals
        // URL: type=team; view=innings; orderby=team_score
        const highestUrl = `https://stats.espncricinfo.com/ci/engine/stats/index.html?class=${classId};filter=advanced;ground=${groundId};orderby=team_score;template=results;type=team;view=innings`;
        await page.goto(highestUrl, { waitUntil: 'networkidle2', timeout: 30000 });
        const highestHtml = await page.content();
        const $h = cheerio.load(highestHtml);
        
        const highestRow = $h('table.engineTable').eq(2).find('tr.data1').first();
        if (highestRow.length > 0) {
            const cols = highestRow.find('td');
            console.log(`Highest Total: ${$h(cols[0]).text().trim()} by ${$h(cols[1]).text().trim()}`);
        } else {
            console.log('Highest Total: N/A');
        }

        // 2. Lowest Team Totals
        // URL: type=team; view=innings; orderby=team_score; orderbyad=reverse
        const lowestUrl = `https://stats.espncricinfo.com/ci/engine/stats/index.html?class=${classId};filter=advanced;ground=${groundId};orderby=team_score;orderbyad=reverse;template=results;type=team;view=innings`;
        await page.goto(lowestUrl, { waitUntil: 'networkidle2', timeout: 30000 });
        const lowestHtml = await page.content();
        const $l = cheerio.load(lowestHtml);
        
        const lowestRow = $l('table.engineTable').eq(2).find('tr.data1').first();
        if (lowestRow.length > 0) {
            const cols = lowestRow.find('td');
            console.log(`Lowest Total: ${$l(cols[0]).text().trim()} by ${$l(cols[1]).text().trim()}`);
        } else {
            console.log('Lowest Total: N/A');
        }

        // 3. Averages (1st vs 2nd innings)
        // URL: type=team; view=innings; groupby=innings
        const avgUrl = `https://stats.espncricinfo.com/ci/engine/stats/index.html?class=${classId};filter=advanced;ground=${groundId};groupby=innings;template=results;type=team;view=innings`;
        await page.goto(avgUrl, { waitUntil: 'networkidle2', timeout: 30000 });
        const avgHtml = await page.content();
        const $a = cheerio.load(avgHtml);
        
        $a('table.engineTable').eq(2).find('tr.data1').each((i, el) => {
            const cols = $a(el).find('td');
            const inns = $a(cols[0]).text().trim();
            const rpo = $a(cols[6]).text().trim();
            console.log(`Innings: ${inns}, RPO: ${rpo}`);
        });

    } catch (e) {
        console.error('Error:', e.message);
    } finally {
        await browser.close();
    }
}

// 57980 = Eden Gardens
// Class 1 = Tests, Class 2 = ODIs, Class 3 = T20Is
scrapeStatGuruDeepStats('57980', '1');
