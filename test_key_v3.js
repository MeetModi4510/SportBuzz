import axios from 'axios';

const API_KEY = '3609207a-ed09-4b47-9c3b-4adcd8e25176';
const URL = 'https://api.cricapi.com/v1/matches?apikey=' + API_KEY + '&offset=0';

async function test() {
    try {
        console.log('Testing key:', API_KEY);
        const res = await axios.get(URL);
        console.log('Status Code:', res.status);
        console.log('Data Status:', res.data.status);
        if (res.data.data) {
            console.log('Matches Found:', res.data.data.length);
        } else {
            console.log('No data. Reason:', res.data.reason);
        }
    } catch (err) {
        console.error('Fetch Error:', err.message);
    }
}

test();
