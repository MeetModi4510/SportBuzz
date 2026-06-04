
import axios from 'axios';

const URL = `http://localhost:5000/api/featured/matches`;

console.log('Testing Local API:', URL);

async function test() {
    try {
        const res = await axios.get(URL);
        console.log('Status:', res.status);
        console.log('Success:', res.data.success);
        if (res.data.data?.cricket) {
            const { test, odi, t20 } = res.data.data.cricket;
            console.log(`Test: ${test.length}, ODI: ${odi.length}, T20: ${t20.length}`);
        } else {
            console.log('No cricket data found:', res.data);
        }
    } catch (err) {
        console.error('Error:', err.message);
        if (err.response) {
            console.error('Response Data:', err.response.data);
        }
    }
}

test();
