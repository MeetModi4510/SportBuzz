const axios = require('axios');

async function testUpdateTeam() {
    const baseUrl = 'http://localhost:5000/api/football';
    // This script requires an auth token. Since I can't easily get one here, 
    // I'll just check if the route exists by making a request without token and seeing if it returns 401 instead of 404.
    try {
        await axios.put(`${baseUrl}/teams/123456789012345678901234`, {});
    } catch (error) {
        if (error.response && error.response.status === 401) {
            console.log('SUCCESS: Route exists and is protected (returned 401)');
        } else {
            console.log('FAILED: Returned ' + (error.response ? error.response.status : 'no response'));
        }
    }
}

testUpdateTeam();
