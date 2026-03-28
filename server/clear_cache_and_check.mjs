import axios from 'axios';

const KEY = '8c2b33ac-020f-4915-83bb-f30194ffe9a3'; // New key
const BASE = 'https://api.cricapi.com/v1';

async function checkFreshData() {
    console.log('Fetching FRESH data (bypassing cache)...');

    try {
        // 1. Check /currentMatches
        console.log('\n--- /currentMatches ---');
        const cmRes = await axios.get(`${BASE}/currentMatches?apikey=${KEY}&offset=0`);
        const cm = cmRes.data.data || [];
        console.log(`Found ${cm.length} matches.`);
        const cmMatch = cm.find(m => m.name.includes('Australia') || m.name.includes('AUS'));
        if (cmMatch) {
            console.log(`FOUND AUS Match: ${cmMatch.name}`);
            console.log(`ID: ${cmMatch.id}`);
            console.log(`Score:`, JSON.stringify(cmMatch.score, null, 2));
        } else {
            console.log('No Australia match found in currentMatches.');
        }

        // 2. Check /matches
        console.log('\n--- /matches ---');
        const mRes = await axios.get(`${BASE}/matches?apikey=${KEY}&offset=0`);
        const m = mRes.data.data || [];
        console.log(`Found ${m.length} matches.`);
        const mMatch = m.find(mx => mx.name.includes('Australia') || mx.name.includes('AUS'));
        if (mMatch) {
            console.log(`FOUND AUS Match: ${mMatch.name}`);
            console.log(`ID: ${mMatch.id}`);
            console.log(`Score:`, JSON.stringify(mMatch.score, null, 2));
        } else {
            console.log('No Australia match found in matches list.');
        }

    } catch (err) {
        console.error('API Error:', err.message);
    }
}

checkFreshData();
