import axios from 'axios';

const KEY = '8c2b33ac-020f-4915-83bb-f30194ffe9a3'; // New key
const BASE = 'https://api.cricapi.com/v1';

async function checkApiKey() {
    console.log('Checking API Key validity...');
    try {
        // Check /countries (cheap call)
        console.log('Fetching /countries...');
        const cRes = await axios.get(`${BASE}/countries?apikey=${KEY}`);
        console.log(`Countries success: ${cRes.data.status}`);

        // Check /matches (first 5 results)
        console.log('Fetching /matches (first 5)...');
        const mRes = await axios.get(`${BASE}/matches?apikey=${KEY}&offset=0`);
        const matches = mRes.data.data || [];
        console.log(`Matches found: ${matches.length}`);
        if (matches.length > 0) {
            console.log('Sample Match:', matches[0].name, `| ID: ${matches[0].id}`);
        }

    } catch (err) {
        console.error('API Error:', err.message);
        if (err.response) {
            console.error('Response:', JSON.stringify(err.response.data, null, 2));
        }
    }
}

checkApiKey();
