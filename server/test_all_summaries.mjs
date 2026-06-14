import axios from 'axios';

async function testAllMatchDetails() {
    try {
        const fifaRes = await axios.get('https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=20260610-20260620');
        const fifaEvents = fifaRes.data.events || [];
        
        for (const e of fifaEvents) {
            const matchId = e.id;
            try {
                await axios.get(`https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/summary`, {
                    params: { event: matchId }
                });
                console.log(`[OK] ${e.name} (${matchId})`);
            } catch (err) {
                console.log(`[FAIL] ${e.name} (${matchId}) - ${err.response?.status}`);
            }
        }
    } catch (err) {
        console.error("FAIL:", err.message);
    }
}
testAllMatchDetails();
