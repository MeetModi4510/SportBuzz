import axios from 'axios';

async function testFetchMikel() {
    try {
        const url = 'http://localhost:5000/api/football/v3/player-profile/198522';
        console.log("Fetching Mikel...");
        const res = await axios.get(url);
        console.log("SUCCESS:", res.data.data?.name);
    } catch (e) {
        console.log("ERROR:", e.message);
    }
}
testFetchMikel();
