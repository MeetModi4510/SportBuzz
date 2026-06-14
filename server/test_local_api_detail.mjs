import axios from 'axios';

async function testLocalApi() {
    try {
        console.log("Fetching local detail API...");
        const res = await axios.get('http://localhost:5000/api/football/v3/matches/detail/760415');
        console.log("STATUS:", res.status);
        console.log("DATA KEYS:", Object.keys(res.data));
    } catch (err) {
        console.error("FAIL:", err.message);
        console.error("RESPONSE:", err.response?.data);
    }
}
testLocalApi();
