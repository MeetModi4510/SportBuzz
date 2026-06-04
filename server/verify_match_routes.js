
import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

async function testRoutes() {
    try {
        console.log('--- Testing Cricket Matches List ---');
        const matchesRes = await axios.get(`${BASE_URL}/cricket/matches`);
        const matches = matchesRes.data.data;
        console.log(`Found ${matches.length} matches.`);

        if (matches.length > 0) {
            const firstMatch = matches[0];
            const matchId = firstMatch.id;
            console.log(`\nTesting Match Details for ID: ${matchId}`);

            console.log('\n--- Testing /cricket/match/:id (Old Route) ---');
            const oldRouteRes = await axios.get(`${BASE_URL}/cricket/match/${matchId}`);
            console.log('Status:', oldRouteRes.status);
            console.log('Data Success:', oldRouteRes.data.status === 'success');

            console.log('\n--- Testing /cricket/match/:id/info (New Alias Route) ---');
            const newRouteRes = await axios.get(`${BASE_URL}/cricket/match/${matchId}/info`);
            console.log('Status:', newRouteRes.status);
            console.log('Data Success:', newRouteRes.data.status === 'success');

            if (oldRouteRes.data.data.id === newRouteRes.data.data.id) {
                console.log('\n✅ Route alias works correctly!');
            } else {
                console.log('\n❌ Route data mismatch!');
            }
            
            console.log('\n--- Testing Cricbuzz Proxy Routes ---');
            try {
                const scorecardRes = await axios.get(`${BASE_URL}/cricket/cb/scorecard/${matchId}`);
                console.log('Scorecard Status:', scorecardRes.status);
            } catch (e) {
                console.log('Scorecard Error (likely no mapping yet):', e.message);
            }
        }
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response) {
            console.error('Response Data:', error.response.data);
        }
    }
}

testRoutes();
