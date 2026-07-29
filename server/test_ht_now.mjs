// Test the full flow: find match ID and verify CDN
import axios from 'axios';
import * as cheerio from 'cheerio';

// Simulate for Nepal vs Namibia (current live match from the live-score page)
const teamA = 'Namibia';
const teamB = 'Nepal';

const cleanT1 = teamA.toLowerCase().replace(/[^a-z0-9]/g, '');
const cleanT2 = teamB.toLowerCase().replace(/[^a-z0-9]/g, '');
console.log('Searching for:', cleanT1, 'vs', cleanT2);

const res = await axios.get('https://www.hindustantimes.com/cricket/live-score', {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
    responseType: 'arraybuffer',
    timeout: 10000
});
const $ = cheerio.load(new TextDecoder('utf-8').decode(res.data));

$('a[href*="/cricket/"]').each((i, el) => {
    const href = $(el).attr('href') || '';
    if (!href.includes('-live-score') && !href.includes('live-scorecard') &&
        !href.includes('match-result') && !href.includes('scorecard')) return;
    
    const hrefSlug = href.toLowerCase();
    const hasT1 = hrefSlug.includes(cleanT1);
    const hasT2 = hrefSlug.includes(cleanT2);
    
    if (hasT1 || hasT2) {
        console.log('Found partial match:', href);
        const idMatch = href.match(/(\d{6})$/);
        console.log('  ID match:', idMatch?.[1]);
    }
});

// Also try testing the CDN HEAD vs GET
const testId = '270954';
console.log('\nTesting CDN HEAD:');
try {
    const r = await axios.head(`https://www.hindustantimes.com/static-content/10s/commentary_${testId}_1.json`, { timeout: 5000 });
    console.log('HEAD status:', r.status);
} catch(e) {
    console.log('HEAD FAILED:', e.message, e.response?.status);
}
console.log('\nTesting CDN GET:');
try {
    const r = await axios.get(`https://www.hindustantimes.com/static-content/10s/commentary_${testId}_1.json`, { timeout: 5000 });
    console.log('GET status:', r.status, 'keys:', Object.keys(r.data || {}).slice(0,5));
} catch(e) {
    console.log('GET FAILED:', e.message, e.response?.status);
}
