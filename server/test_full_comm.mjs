import * as cheerio from 'cheerio';

async function testFullCommInnings() {
    // Notice the path: /api/cricket-match/commentary/148404
    // Wait, let's use the standard URL since /api/cricket-match/commentary just redirects to the main page!
    // But earlier I said `live-cricket-full-commentary/148404/ind-vs-afg...`
    // What if the ball-by-ball commentary is simply fetched via a GraphQL API or something?
    
    // Let's try to extract from https://www.cricbuzz.com/cricket-full-commentary/148404/ind-vs-afg-2nd-odi-afghanistan-tour-of-india-2026
    const res = await fetch('https://www.cricbuzz.com/cricket-full-commentary/148404/ind-vs-afg-2nd-odi-afghanistan-tour-of-india-2026');
    const html = await res.text();
    const $ = cheerio.load(html);

    let fullJsonStr = '';
    $('script').each((_, el) => {
        const text = $(el).html() || '';
        if (text.includes('self.__next_f.push')) {
            const match = text.match(/self\.__next_f\.push\(\[1,"(.*)"\]\)/);
            if (match && match[1]) {
                try {
                    let cleaned = match[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\');
                    fullJsonStr += cleaned + '\n';
                } catch(e) {}
            }
        }
    });

    const matches = fullJsonStr.match(/"commText":"(.*?)"/g);
    if (matches) {
        console.log('Found', matches.length, 'commText occurrences!');
    } else {
        console.log('No commText found at all in Next.js payload.');
    }
}

testFullCommInnings();
