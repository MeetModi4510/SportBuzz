
import axios from 'axios';

const API_KEY = '3609207a-ed09-4b47-9c3b-4adcd8e25176';
const EXTERNAL_URL = `https://api.cricapi.com/v1/currentMatches?apikey=${API_KEY}&offset=0`;
const LOCAL_URL = 'http://localhost:5000/api/featured/matches';

const checkExternalAPI = async () => {
    console.log("\n1. Checking External Cricket API...");
    try {
        const response = await axios.get(EXTERNAL_URL);
        const data = response.data;

        console.log(`   Status: ${data.status}`);
        if (data.info) console.log(`   Info: ${JSON.stringify(data.info)}`);
        if (data.data) console.log(`   Matches Fetched: ${data.data.length}`);

        // CricAPI sometimes sends usage in headers
        if (response.headers['x-ratelimit-remaining']) {
            console.log(`   Hits Remaining: ${response.headers['x-ratelimit-remaining']}`);
        }
        if (response.headers['x-ratelimit-limit']) {
            console.log(`   Daily Limit: ${response.headers['x-ratelimit-limit']}`);
        }

        if (data.status !== 'success') {
            console.error("   ⚠️ API FAILURE:", data.status, data.reason || '');
        } else {
            console.log("   ✅ External API is working.");
        }
    } catch (error) {
        console.error("   ❌ External API Error:", error.message);
        if (error.response) console.error("   Response:", error.response.data);
    }
};

const checkLocalEndpoint = async () => {
    console.log("\n2. Checking Local Backend Endpoint...");
    try {
        const response = await axios.get(LOCAL_URL);
        const data = response.data; // { success: true, data: { cricket: { test:..., odi:..., t20:... } } }

        if (data.success) {
            const { test, odi, t20 } = data.data.cricket || {};
            console.log("   ✅ Backend returned success.");
            console.log(`   Test Matches: ${test?.liveOrFallbackMatch ? 'Yes' : 'No'} / ${test?.latestCompletedMatch ? 'Yes' : 'No'}`);
            console.log(`   ODI Matches:  ${odi?.liveOrFallbackMatch ? 'Yes' : 'No'} / ${odi?.latestCompletedMatch ? 'Yes' : 'No'}`);
            console.log(`   T20 Matches:  ${t20?.liveOrFallbackMatch ? 'Yes' : 'No'} / ${t20?.latestCompletedMatch ? 'Yes' : 'No'}`);

            // Check if arrays are actually populated
            console.log("   Full Structure Keys:", Object.keys(data.data.cricket || {}));
        } else {
            console.error("   ⚠️ Backend returned failure:", data);
        }

    } catch (error) {
        console.error("   ❌ Local Backend Error:", error.message);
        if (error.code === 'ECONNREFUSED') {
            console.error("   Is the server running on port 5000?");
        }
    }
};

const run = async () => {
    await checkExternalAPI();
    await checkLocalEndpoint();
};

run();
