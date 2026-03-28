import axios from 'axios';

const KEY = '8c2b33ac-020f-4915-83bb-f30194ffe9a3'; // New key
const BASE = 'https://api.cricapi.com/v1';
const WC_ID = '0cdf6736-ad9b-4e95-a647-5ee3a99c5510';

async function checkWCSeries() {
    console.log(`Checking Series ID: ${WC_ID} with NEW KEY...`);

    try {
        const res = await axios.get(`${BASE}/series_info?apikey=${KEY}&id=${WC_ID}`);
        const matches = res.data?.data?.matchList || [];

        console.log(`Found ${matches.length} matches in series.`);

        const targetMatch = matches.find(m => m.id === '9148b8df-145f-4319-b33f-6674b69cdbb3');

        if (targetMatch) {
            console.log('\n*** FOUND THE MATCH IN SERIES ***');
            console.log('Name:', targetMatch.name);
            console.log('ID:', targetMatch.id);
            console.log('Status:', targetMatch.status);
            console.log('Match Started:', targetMatch.matchStarted);
            console.log('Match Ended:', targetMatch.matchEnded);
            console.log('Score:', JSON.stringify(targetMatch.score, null, 2));

            // Check match_info as well
            console.log('\nFetching match_info for this match...');
            const mRes = await axios.get(`${BASE}/match_info?apikey=${KEY}&id=${targetMatch.id}`);
            console.log('Score (match_info):', JSON.stringify(mRes.data.data?.score, null, 2));

        } else {
            console.log('Match NOT found in this series list.');
        }

    } catch (err) {
        console.error('API Error:', err.message);
    }
}

checkWCSeries();
