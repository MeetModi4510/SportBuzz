import axios from 'axios';
import * as cheerio from 'cheerio';

const teamA = 'India';
const teamB = 'England';
const matchDate = new Date('2026-07-16').getTime(); // Jul 16 ODI at Cardiff
const matchFormat = 'ODI';

const MONTH_NAMES = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
let d = new Date(Number(matchDate));
const year     = d.getFullYear().toString();
const monthStr = MONTH_NAMES[d.getMonth()];
const day      = d.getDate().toString();
const cleanFormat = matchFormat.toLowerCase().replace(/[^a-z0-9]/g, '');
const cleanT1 = teamA.toLowerCase().replace(/under-19/g,'u19').replace(/women/g,'w').replace(/[^a-z0-9]/g,'');
const cleanT2 = teamB.toLowerCase().replace(/under-19/g,'u19').replace(/women/g,'w').replace(/[^a-z0-9]/g,'');

console.log(`Signals: year=${year} month=${monthStr} day=${day} format=${cleanFormat}`);
console.log(`Teams: cleanT1=${cleanT1}  cleanT2=${cleanT2}\n`);

const urls = [
    'https://sports.ndtv.com/cricket/live-scores',
    'https://sports.ndtv.com/cricket/results',
    'https://www.hindustantimes.com/cricket/live-score',
    'https://www.hindustantimes.com/cricket/match-results',
    'https://www.hindustantimes.com/cricket/results',
];

for (const url of urls) {
    try {
        console.log(`\n=== Checking: ${url} ===`);
        const res = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
            timeout: 10000
        });

        const $ = cheerio.load(res.data);
        const candidates = [];

        $('a[href*="/cricket/"]').each((i, el) => {
            const href = $(el).attr('href');
            if (!href) return;
            if (!href.includes('-live-score') && !href.includes('live-scorecard') &&
                !href.includes('match-result') && !href.includes('scorecard')) return;

            const text     = $(el).text().toLowerCase().replace(/under-19/g,'u19').replace(/women/g,'w');
            const title    = ($(el).attr('title')||'').toLowerCase().replace(/under-19/g,'u19').replace(/women/g,'w');
            const hrefSlug = href.toLowerCase().replace(/under-19/g,'u19').replace(/women/g,'w');
            const combined = text + ' ' + title + ' ' + hrefSlug;

            const hasT1 = combined.includes(cleanT1) || combined.replace(/[^a-z0-9]/g,'').includes(cleanT1);
            const hasT2 = combined.includes(cleanT2) || combined.replace(/[^a-z0-9]/g,'').includes(cleanT2);
            if (!hasT1 || !hasT2) return;

            let score = 10;
            const hasYear  = combined.includes(year);
            const hasMon   = combined.includes(monthStr);
            const hasDay   = combined.includes(day);
            const hasFmt   = combined.includes(cleanFormat);
            if (hasYear)  score += 40;
            if (hasMon)   score += 20;
            if (hasDay)   score += 10;
            if (hasFmt)   score += 15;

            const idMatch = href.match(/(\d{6})$/);
            if (idMatch) {
                candidates.push({ href, score, id: idMatch[1], hasYear, hasMon, hasDay, hasFmt });
            }
        });

        if (candidates.length === 0) {
            console.log('  No matching candidates found.');
        } else {
            candidates.sort((a,b) => b.score - a.score);
            console.log(`  Found ${candidates.length} candidates:`);
            candidates.slice(0, 5).forEach((c, i) => {
                console.log(`  [${i+1}] score=${c.score} id=${c.id} year=${c.hasYear} mon=${c.hasMon} day=${c.hasDay} fmt=${c.hasFmt}`);
                console.log(`       ${c.href}`);
            });
        }
    } catch(e) {
        console.log(`  ERROR: ${e.message}`);
    }
}
