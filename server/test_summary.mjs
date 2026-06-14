import axios from 'axios';

async function testMatchDetail() {
    try {
        const matchId = '760415';
        console.log(`Testing eng.1/summary for match ${matchId}...`);
        const res = await axios.get(`https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/summary`, {
            params: { event: matchId }
        });
        console.log("Success! Data keys:", Object.keys(res.data));
    } catch (err) {
        console.error("FAIL eng.1:", err.message);
    }
    
    try {
        const matchId = '760415';
        console.log(`Testing fifa.world/summary for match ${matchId}...`);
        const res = await axios.get(`https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/summary`, {
            params: { event: matchId }
        });
        console.log("Success! Data keys:", Object.keys(res.data));
    } catch (err) {
        console.error("FAIL fifa.world:", err.message);
    }
    
    try {
        const matchId = '760415';
        console.log(`Testing generic summary for match ${matchId}...`);
        const res = await axios.get(`https://site.api.espn.com/apis/site/v2/sports/soccer/summary`, {
            params: { event: matchId }
        });
        console.log("Success! Data keys:", Object.keys(res.data));
    } catch (err) {
        console.error("FAIL generic:", err.message);
    }
}
testMatchDetail();
