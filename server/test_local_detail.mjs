import axios from 'axios';

async function testMatchDetail() {
    try {
        console.log("Fetching fifa.world to get an event ID...");
        const fifaRes = await axios.get('https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=20260610-20260620');
        const fifaEvents = fifaRes.data.events || [];
        if (fifaEvents.length === 0) return console.log("No events found.");
        
        const eventId = fifaEvents[0].id;
        console.log(`Testing event ID: ${eventId} (${fifaEvents[0].name})`);
        
        console.log(`Fetching local detail route...`);
        const res = await axios.get(`http://localhost:5000/api/football/v3/matches/detail/${eventId}`);
        console.log("Status:", res.status);
        console.log("Data Keys:", Object.keys(res.data));
    } catch (err) {
        console.error("FAIL:", err.message);
        console.error("Response:", err.response?.data);
    }
}
testMatchDetail();
