import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config({ path: './server/.env' });

const KEY = process.env.CRICKETDATA_KEY;
const BASE = 'https://api.cricapi.com/v1';

async function debugLions() {
    console.log('=== RAW API DATA for Lions vs KwaZulu-Natal ===\n');

    // Step 1: Find match in /matches
    const matchesRes = await axios.get(`${BASE}/matches?apikey=${KEY}&offset=0`);
    const allMatches = matchesRes.data?.data || [];
    const lions = allMatches.find(m => (m.name || '').includes('Lions') && (m.name || '').includes('KwaZulu'));

    if (lions) {
        console.log('--- FROM /matches endpoint ---');
        console.log('Name:', lions.name);
        console.log('ID:', lions.id);
        console.log('Status:', lions.status);
        console.log('matchStarted:', lions.matchStarted);
        console.log('matchEnded:', lions.matchEnded);
        console.log('score:', JSON.stringify(lions.score, null, 2));
        console.log('teamInfo:', JSON.stringify(lions.teamInfo, null, 2));
        console.log('dateTimeGMT:', lions.dateTimeGMT);

        // Step 2: Try /match_info for the same match
        console.log('\n--- FROM /match_info endpoint ---');
        const infoRes = await axios.get(`${BASE}/match_info?apikey=${KEY}&id=${lions.id}`);
        const info = infoRes.data?.data;
        if (info) {
            console.log('Status:', info.status);
            console.log('score:', JSON.stringify(info.score, null, 2));
            console.log('teamInfo:', JSON.stringify(info.teamInfo, null, 2));
        } else {
            console.log('No data returned from /match_info');
        }
    } else {
        console.log('Lions match NOT found in /matches endpoint.');

        // Try /currentMatches
        const currentRes = await axios.get(`${BASE}/currentMatches?apikey=${KEY}&offset=0`);
        const current = currentRes.data?.data || [];
        const lionsC = current.find(m => (m.name || '').includes('Lions') && (m.name || '').includes('KwaZulu'));
        if (lionsC) {
            console.log('--- FROM /currentMatches endpoint ---');
            console.log('Name:', lionsC.name);
            console.log('score:', JSON.stringify(lionsC.score, null, 2));
        } else {
            console.log('Lions match NOT found in /currentMatches either.');
        }
    }
}

debugLions().catch(e => console.error(e.message));
