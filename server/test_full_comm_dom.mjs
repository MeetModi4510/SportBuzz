import * as cheerio from 'cheerio';

async function testFullCommDOM() {
    const res = await fetch('https://www.cricbuzz.com/live-cricket-full-commentary/148404/ind-vs-afg-2nd-odi-afghanistan-tour-of-india-2026');
    const html = await res.text();
    const $ = cheerio.load(html);

    let foundBalls = [];
    $('*').each((_, el) => {
        const text = $(el).text();
        if (text && text.trim().match(/^\d+\.\d+$/)) {
            const tagName = $(el).prop('tagName');
            const className = $(el).attr('class');
            foundBalls.push({ text: text.trim(), tagName, className });
        }
    });
    console.log('Found balls:', foundBalls.length);
    console.log('First 5:', foundBalls.slice(0, 5));
}

testFullCommDOM();
