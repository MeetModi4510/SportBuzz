import * as cheerio from 'cheerio';

async function test() {
    console.log("Fetching archives...");
    const res = await fetch('https://www.cricbuzz.com/cricket-scorecard-archives');
    const html = await res.text();
    const $ = cheerio.load(html);
    
    const years = [];
    $('a').each((i, el) => {
        const href = $(el).attr('href');
        const text = $(el).text().trim();
        if (href && href.includes('/cricket-scorecard-archives/') && text.match(/^\d{4}$/)) {
            years.push({ year: text, href });
        }
    });
    console.log('Years:', years);
    
    // Now fetch one year to see series
    if (years.length > 0) {
        const yearUrl = 'https://www.cricbuzz.com' + years[0].href;
        console.log("Fetching year " + years[0].year);
        const res2 = await fetch(yearUrl);
        const html2 = await res2.text();
        const $2 = cheerio.load(html2);
        
        const series = [];
        $2('a').each((i, el) => {
            const href = $2(el).attr('href');
            const text = $2(el).text().trim();
            if (href && href.includes('/cricket-series/') && text.toLowerCase().includes('indian premier league')) {
                series.push({ name: text, href });
            }
        });
        console.log(`Series in ${years[0].year}:`, series);
    }
}
test();
