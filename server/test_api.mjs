import axios from 'axios';

async function testJsonAPI() {
    try {
        const res = await axios.get('https://www.cricbuzz.com/match-api/148404/commentary.json', { validateStatus: null });
        console.log('Status:', res.status);
    } catch(e) {}
}
testJsonAPI();
