import axios from 'axios';

const KEY = '10d3fca6-f7ac-476b-8b3f-f3b631a5d358';
const BASE = 'https://api.cricapi.com/v1';

async function check() {
    console.log('Checking for "Namibia" matches in ALL endpoints...\n');

    // 1. /matches
    try {
        const r1 = await axios.get(`${BASE}/matches`, { params: { apikey: KEY, offset: 0 } });
        const m1 = (r1.data.data || []).filter(m => (m.name || '').includes('Namibia'));
        console.log(`--- /matches (${m1.length} found) ---`);
        m1.forEach(m => console.log(`${m.name} | Status: ${m.status} | Date: ${m.dateTimeGMT}`));
    } catch (e) {
        console.error('/matches error:', e.message);
    }

    // 2. /currentMatches
    try {
        const r2 = await axios.get(`${BASE}/currentMatches`, { params: { apikey: KEY, offset: 0 } });
        const m2 = (r2.data.data || []).filter(m => (m.name || '').includes('Namibia'));
        console.log(`\n--- /currentMatches (${m2.length} found) ---`);
        m2.forEach(m => console.log(`${m.name} | Status: ${m.status}`));
    } catch (e) {
        console.error('/currentMatches error:', e.message);
    }

    // 3. WC Series
    try {
        const r3 = await axios.get(`${BASE}/series_info`, { params: { apikey: KEY, id: '0cdf6736-ad9b-4e95-a647-5ee3a99c5510' } });
        const m3 = (r3.data.data?.matchList || []).filter(m => (m.name || '').includes('Namibia'));
        console.log(`\n--- WC Series (${m3.length} found) ---`);
        m3.sort((a, b) => new Date(a.dateTimeGMT) - new Date(b.dateTimeGMT)); // Sort by date
        m3.forEach(m => console.log(`${m.name} | Status: ${m.status} | Date: ${m.dateTimeGMT} | Ended: ${m.matchEnded}`));
    } catch (e) {
        console.error('WC Series error:', e.message);
    }
}

check();
