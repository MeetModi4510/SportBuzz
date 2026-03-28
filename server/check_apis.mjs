import axios from 'axios';

const KEY = '10d3fca6-f7ac-476b-8b3f-f3b631a5d358';
const BASE = 'https://api.cricapi.com/v1';

console.log('='.repeat(80));
console.log('1. /currentMatches API Response');
console.log('='.repeat(80));
try {
    const res1 = await axios.get(`${BASE}/currentMatches`, {
        params: { apikey: KEY, offset: 0 }
    });
    console.log(JSON.stringify(res1.data, null, 2));
} catch (e) {
    console.error('ERROR:', e.message);
}

console.log('\n' + '='.repeat(80));
console.log('2. /matches API Response');
console.log('='.repeat(80));
try {
    const res2 = await axios.get(`${BASE}/matches`, {
        params: { apikey: KEY, offset: 0 }
    });
    console.log(JSON.stringify(res2.data, null, 2));
} catch (e) {
    console.error('ERROR:', e.message);
}

console.log('\n' + '='.repeat(80));
console.log('3. /match_info/{matchId} API Response (Lions vs KNIT)');
console.log('='.repeat(80));
try {
    const res3 = await axios.get(`${BASE}/match_info`, {
        params: { apikey: KEY, id: '6eb7b3cb-f0be-4380-b660-41a0e02609b2' }
    });
    console.log(JSON.stringify(res3.data, null, 2));
} catch (e) {
    console.error('ERROR:', e.message);
}
