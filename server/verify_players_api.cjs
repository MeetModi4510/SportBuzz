const axios = require('axios');

const API_URL = 'http://localhost:5000/api';
// We need an admin token. Assuming we can get one or the server is running with bypass for local testing.
// In this case, I'll just check if the endpoint exists and returns something.
// Since I'm running in the same environment, I might not have a token easily.
// But I can try to hit the health check first.

async function verifyPlayers() {
    try {
        console.log('Checking health...');
        const health = await axios.get(`${API_URL}/health`);
        console.log('Health:', health.data.success ? 'OK' : 'FAIL');

        console.log('Checking admin players endpoint (expected 401/403 if no token)...');
        try {
            const players = await axios.get(`${API_URL}/admin/players`);
            console.log('Players Status:', players.status);
            console.log('Player Count:', players.data.data.length);
        } catch (e) {
            if (e.response && (e.response.status === 401 || e.response.status === 403)) {
                console.log('Endpoint exists but requires authentication (Correct)');
            } else {
                console.error('Error hitting players endpoint:', e.message);
                if (e.response) console.error('Response data:', e.response.data);
            }
        }
    } catch (e) {
        console.error('FAILED to connect to server:', e.message);
    }
}

verifyPlayers();
