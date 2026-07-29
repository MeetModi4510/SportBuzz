import axios from 'axios';
import fs from 'fs';

// We saw api.hindustantimes.com is a real domain.
// Also their JS bundle is at: /_next/static/chunks/pages/cricket/commentary-live-[id]-670a21439b4d175d.js
// Let's check that JS bundle to find the API endpoint used for pagination

const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Referer': 'https://www.hindustantimes.com/'
};

// 1. Check the JS bundle for the commentary page
console.log('=== Checking the commentary page JS bundle ===');
try {
    const jsUrl = 'https://www.hindustantimes.com/_next/static/chunks/pages/cricket/commentary-live-%5Bid%5D-670a21439b4d175d.js';
    const res = await axios.get(jsUrl, { headers, timeout: 8000 });
    const js = res.data;
    fs.writeFileSync('ht_commentary_bundle.js', js);
    console.log(`Bundle size: ${(js.length/1024).toFixed(0)}KB`);
    
    // Search for API URL patterns inside the bundle
    const apiMatches = js.match(/https?:\/\/[^"'`\s]{15,}/g) || [];
    const unique = [...new Set(apiMatches)];
    console.log('\nAPI URLs found in bundle:');
    unique.forEach(u => console.log(' ', u));
    
    // Search for fetch/api calls
    const fetchMatches = js.match(/fetch\([^)]{5,80}/g) || [];
    console.log('\nFetch calls found:');
    fetchMatches.slice(0, 10).forEach(f => console.log(' ', f));
    
    // Search for commentary endpoint patterns
    const commEndpoints = js.match(/['"]/g) ? js.match(/commentary[^"'`\s]{3,60}/g) || [] : [];
    console.log('\nCommentary endpoint patterns:');
    [...new Set(commEndpoints)].slice(0, 10).forEach(c => console.log(' ', c));
    
} catch(e) {
    console.log('Bundle failed:', e.message);
}

// 2. Try the api.hindustantimes.com domain with known patterns
console.log('\n\n=== Testing api.hindustantimes.com ===');
const apiTests = [
    'https://api.hindustantimes.com/cricket/getCommentary?matchId=271827&inning=2&page=1',
    'https://api.hindustantimes.com/cricket/commentary/271827?inning=2',
    'https://api.hindustantimes.com/api/v1/cricket/commentary/271827',
    'https://api.hindustantimes.com/cricket/getMatchCommentary?matchId=271827',
];

for (const url of apiTests) {
    console.log(`\nTrying: ${url}`);
    try {
        const res = await axios.get(url, { headers, timeout: 5000 });
        console.log(`Status: ${res.status} | Type: ${typeof res.data}`);
        if (typeof res.data === 'object') {
            console.log('Keys:', Object.keys(res.data).join(', '));
        } else {
            console.log('Data:', String(res.data).substring(0, 150));
        }
    } catch(e) {
        console.log('Failed:', e.response?.status || e.message);
    }
}
