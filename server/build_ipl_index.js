import * as cheerio from 'cheerio';
import fs from 'fs';

async function buildIplIndex() {
    console.log("Fetching archives...");
    const res = await fetch('https://www.cricbuzz.com/cricket-scorecard-archives');
    const html = await res.text();
    const $ = cheerio.load(html);
    
    const years = [];
    $('a').each((i, el) => {
        const href = $(el).attr('href');
        const text = $(el).text().trim();
        if (href && href.includes('/cricket-scorecard-archives/') && text.match(/^\d{4}$/)) {
            const yr = parseInt(text, 10);
            if (yr >= 2008) {
                years.push({ year: yr, href });
            }
        }
    });
    
    const iplSeasons = [];
    
    for (const y of years) {
        console.log(`Fetching ${y.year}...`);
        const yearUrl = 'https://www.cricbuzz.com' + y.href;
        const res2 = await fetch(yearUrl);
        const html2 = await res2.text();
        const $2 = cheerio.load(html2);
        
        $2('a').each((i, el) => {
            const href = $2(el).attr('href');
            const text = $2(el).text().trim();
            if (href && href.includes('/cricket-series/') && text.toLowerCase().includes('indian premier league')) {
                // href is like /cricket-series/9241/indian-premier-league-2026/matches
                const parts = href.split('/');
                if (parts.length >= 4) {
                    iplSeasons.push({
                        year: y.year,
                        name: text.replace(/Jan.*|Feb.*|Mar.*|Apr.*|May.*|Jun.*|Jul.*|Aug.*|Sep.*|Oct.*|Nov.*|Dec.*/g, '').trim(),
                        id: parts[2],
                        slug: parts[3]
                    });
                }
            }
        });
        
        // Wait 500ms to avoid rate limit
        await new Promise(r => setTimeout(r, 500));
    }
    
    console.log(JSON.stringify(iplSeasons, null, 2));
    fs.writeFileSync('ipl_seasons.json', JSON.stringify(iplSeasons, null, 2));
}
buildIplIndex();
