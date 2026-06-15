import axios from 'axios';

async function testPlayerApi() {
    try {
        const id = 433177; // Vinicius
        let url = `https://site.web.api.espn.com/apis/common/v3/sports/soccer/eng.1/athletes/${id}`;
        console.log("Testing eng.1:", url);
        await axios.get(url);
        console.log("eng.1 SUCCESS!");
    } catch (e) {
        console.error("eng.1 ERROR:", e.message);
    }
    
    try {
        const id = 433177; // Vinicius
        let url = `https://site.web.api.espn.com/apis/common/v3/sports/soccer/esp.1/athletes/${id}`;
        console.log("Testing esp.1:", url);
        await axios.get(url);
        console.log("esp.1 SUCCESS!");
    } catch (e) {
        console.error("esp.1 ERROR:", e.message);
    }
}

testPlayerApi();
