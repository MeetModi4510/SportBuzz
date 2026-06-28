import axios from 'axios';

const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
};

const res = await axios.get('https://www.cricmetric.com/venue.py?venue=Ahmedabad&format=Test&category=Men', {
    headers: HEADERS, timeout: 15000
});
const html = res.data;

// Extract all script blocks
const scripts = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi)].map(m => m[1]);

// Find url_string occurrences (leaders data API)
const urlStrings = [];
for (const s of scripts) {
    const found = [...s.matchAll(/url_string\s*=\s*["']([^"']+)["']/g)];
    urlStrings.push(...found.map(m => m[1]));
}
console.log('\n=== Leaders Data API URLs ===');
urlStrings.forEach(u => console.log('  ', u));

// Extract match list area
const idx = html.indexOf('Matches at Ahmedabad');
if (idx > -1) {
    const matchSnippet = html.substring(idx, idx + 2000);
    console.log('\n=== Match Section HTML snippet ===');
    console.log(matchSnippet.substring(0, 1000));
}

// Now fetch the batting leaders data using the actual API URL
if (urlStrings.length > 0) {
    const battingUrl = 'https://www.cricmetric.com' + urlStrings[0];
    console.log('\n=== Fetching batting data from:', battingUrl);
    try {
        const dataRes = await axios.get(battingUrl, { headers: HEADERS, timeout: 15000 });
        console.log('Batting data response type:', typeof dataRes.data);
        console.log('Batting data sample:', JSON.stringify(dataRes.data).substring(0, 800));
    } catch (e) {
        console.error('Error fetching batting data:', e.message);
    }
}

// Also find and fetch bowling
const bowlingUrl = urlStrings.find(u => u.includes('Bowling'));
if (bowlingUrl) {
    console.log('\n=== Fetching bowling data from:', 'https://www.cricmetric.com' + bowlingUrl);
    try {
        const bRes = await axios.get('https://www.cricmetric.com' + bowlingUrl, { headers: HEADERS, timeout: 15000 });
        console.log('Bowling data sample:', JSON.stringify(bRes.data).substring(0, 800));
    } catch (e) {
        console.error('Error:', e.message);
    }
}

// Match list endpoint check
const matchListUrls = [...html.matchAll(/matchlist[^"'\s<>]*/g)].map(m => m[0]);
console.log('\n=== Match list URL patterns:', matchListUrls.slice(0, 5));
