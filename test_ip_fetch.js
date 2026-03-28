import axios from 'axios';

const IP_URL = 'http://10.19.33.75:5000/api/featured/matches';

async function testIpFetch() {
    console.log(`Testing fetch from: ${IP_URL}`);
    try {
        const response = await axios.get(IP_URL);
        console.log('Status:', response.status);
        console.log('Body keys:', Object.keys(response.data));
        if (response.data.data?.cricket) {
            const { test, odi, t20 } = response.data.data.cricket;
            console.log(`Counts - Test: ${test?.length}, ODI: ${odi?.length}, T20: ${t20?.length}`);
            if (odi && odi.length > 0) {
                console.log('First ODI:', odi[0].name);
            }
        } else {
            console.log('No cricket data found in response.');
            console.log('Data:', JSON.stringify(response.data, null, 2));
        }
    } catch (err) {
        console.error('Fetch error:', err.message);
        if (err.response) {
            console.error('Response data:', err.response.data);
        }
    }
}

testIpFetch();
