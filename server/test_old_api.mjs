import axios from 'axios';

async function testOldApi() {
    try {
        const res = await axios.get('https://www.cricbuzz.com/match-api/livematches.json');
        console.log("Success!", Object.keys(res.data));
        console.log("First match:", res.data.matches[Object.keys(res.data.matches)[0]]);
    } catch(e) {
        console.log("Failed:", e.message);
    }
}
testOldApi();
