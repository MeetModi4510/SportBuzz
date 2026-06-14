import axios from 'axios';

async function testApi() {
    try {
        console.log("Fetching http://localhost:5000/api/football/v3/matches/upcoming");
        const res = await axios.get('http://localhost:5000/api/football/v3/matches/upcoming');
        console.log("Status:", res.status);
    } catch (err) {
        console.error(err);
    }
}
testApi();
