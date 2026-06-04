import axios from 'axios';
import fs from 'fs';

const KEY = '10d3fca6-f7ac-476b-8b3f-f3b631a5d358';
const BASE = 'https://api.cricapi.com/v1';

// 1. /currentMatches
console.log('Fetching /currentMatches...');
const res1 = await axios.get(`${BASE}/currentMatches`, {
    params: { apikey: KEY, offset: 0 }
});
fs.writeFileSync('api_response_currentMatches.json', JSON.stringify(res1.data, null, 2));
console.log('✓ Saved to api_response_currentMatches.json');

// 2. /matches
console.log('Fetching /matches...');
const res2 = await axios.get(`${BASE}/matches`, {
    params: { apikey: KEY, offset: 0 }
});
fs.writeFileSync('api_response_matches.json', JSON.stringify(res2.data, null, 2));
console.log('✓ Saved to api_response_matches.json');

// 3. /match_info (Lions vs KNIT)
console.log('Fetching /match_info for Lions vs KNIT...');
const res3 = await axios.get(`${BASE}/match_info`, {
    params: { apikey: KEY, id: '6eb7b3cb-f0be-4380-b660-41a0e02609b2' }
});
fs.writeFileSync('api_response_match_info.json', JSON.stringify(res3.data, null, 2));
console.log('✓ Saved to api_response_match_info.json');

console.log('\n✅ All API responses saved!');
