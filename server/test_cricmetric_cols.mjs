import axios from 'axios';

const SUB_API_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'application/json, text/javascript, */*; q=0.01',
    'X-Requested-With': 'XMLHttpRequest',
    'Referer': 'https://www.cricmetric.com/',
};

// Get the fixture URL from the page
const pageRes = await axios.get('https://www.cricmetric.com/venue.py?venue=Ahmedabad&format=Test&category=Men', {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
});
const fixtureUrl = [...pageRes.data.matchAll(/url_string\s*=\s*["']([^"']*fixture_data[^"']*)["']/g)].map(m => m[1])[0];
console.log('Fixture URL:', fixtureUrl);

const res = await axios.get('https://www.cricmetric.com' + fixtureUrl, { headers: SUB_API_HEADERS });
const json = res.data;
const cols = json.cols?.map(c => c.label || c.id);
console.log('\nColumns:', JSON.stringify(cols));
console.log('\nFirst 3 rows:');
(json.rows || []).slice(0, 3).forEach((row, i) => {
    const vals = row.c?.map(c => c?.v);
    console.log(`Row ${i}:`, JSON.stringify(vals));
});

// Also check batting data columns
const battingUrl = [...pageRes.data.matchAll(/url_string\s*=\s*["']([^"']*role=Batting[^"']*)["']/g)].map(m => m[1])[0];
const bRes = await axios.get('https://www.cricmetric.com' + battingUrl, { headers: SUB_API_HEADERS });
const bCols = bRes.data.cols?.map(c => c.label || c.id);
console.log('\nBatting columns:', JSON.stringify(bCols));
console.log('First batting row:', JSON.stringify(bRes.data.rows?.[0]?.c?.map(c => c?.v)));
