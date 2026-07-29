import axios from 'axios';
import * as cheerio from 'cheerio';

// The HTML page has font-bold elements - let's dig into what they actually contain
const matchId = '89704';
const slug = 'rsa-vs-ind-final-icc-mens-t20-world-cup-2024';

const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Referer': 'https://www.cricbuzz.com/'
};

const res = await axios.get(
    `https://www.cricbuzz.com/cricket-full-commentary/${matchId}/${slug}`,
    { headers, timeout: 15000 }
);
const html = res.data;
const $ = cheerio.load(html);

// What does font-bold actually contain?
console.log('=== font-bold elements (first 20) ===');
$('.font-bold').slice(0, 20).each((i, el) => {
    console.log(`  [${i}] "${$(el).text().trim()}" | parent: <${$(el).parent()[0]?.name}> | parent.text: "${$(el).parent().text().trim().substring(0,80)}"`);
});

// Check what __next_f scripts contain
console.log('\n=== __next_f.push scripts - checking keys ===');
const scripts = [];
$('script').each((i, el) => {
    const content = $(el).html() || '';
    if (content.includes('__next_f.push')) scripts.push(content);
});
console.log(`Found ${scripts.length} RSC script tags`);

// Collect all RSC chunks
let allRscData = '';
scripts.forEach((s, i) => {
    const match = s.match(/\[1,"([\s\S]+?)"\]\)/);
    if (match) {
        try {
            const unescaped = JSON.parse('"' + match[1] + '"');
            allRscData += unescaped;
        } catch(_) {
            allRscData += match[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\');
        }
    }
});

console.log(`\nTotal RSC data length: ${allRscData.length}`);
console.log(`Has commentaryList: ${allRscData.includes('commentaryList')}`);
console.log(`Has commLines: ${allRscData.includes('commLines')}`);
console.log(`Has commText: ${allRscData.includes('commText')}`);
console.log(`Has matchPreviewFullComm: ${allRscData.includes('matchPreviewFullComm')}`);
console.log(`Has overNum: ${allRscData.includes('overNum')}`);
console.log(`Has ballNbr: ${allRscData.includes('ballNbr')}`);
console.log(`Has innings: ${allRscData.includes('innings')}`);

// Search for any cricket data keys
const cricketKeys = ['runs', 'wickets', 'bowler', 'batsman', 'over ', 'ball ', 'OUT', 'FOUR', 'SIX'];
cricketKeys.forEach(k => {
    console.log(`Has "${k}": ${allRscData.includes(k)}`);
});

// Print a snippet of the RSC data
console.log('\n=== RSC Data Snippet (first 500 chars) ===');
console.log(allRscData.substring(0, 500));

// Check if there's any JSON with match data
console.log('\n=== Looking for matchId in RSC ===');
const matchIdIdx = allRscData.indexOf(String(matchId));
if (matchIdIdx !== -1) {
    console.log(`Found matchId at index ${matchIdIdx}:`);
    console.log(allRscData.substring(Math.max(0, matchIdIdx - 100), matchIdIdx + 300));
}
