import axios from 'axios';

async function testPlayerApi() {
    try {
        const id = 433177; // Vinicius
        let url = `https://site.web.api.espn.com/apis/common/v3/sports/soccer/athletes/${id}`;
        console.log("Testing generic:", url);
        const res = await axios.get(url);
        console.log("generic SUCCESS! name:", res.data.athlete.displayName);
    } catch (e) {
        console.error("generic ERROR:", e.message);
    }
}

testPlayerApi();
