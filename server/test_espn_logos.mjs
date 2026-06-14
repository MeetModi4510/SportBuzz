import axios from 'axios';

async function checkFederationLogos() {
    try {
        console.log("Fetching fifa.world scoreboard...");
        const res = await axios.get('https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=20260610-20260620');
        const events = res.data.events || [];
        
        if (events.length > 0) {
            const event = events[0];
            const comp = event.competitions[0];
            const homeTeam = comp.competitors.find(c => c.homeAway === 'home').team;
            
            console.log("\n--- Home Team Object (ESPN) ---");
            console.dir(homeTeam, { depth: null });
            
            console.log("\n--- League/Tournament Object ---");
            console.dir(res.data.leagues?.[0], { depth: null });
        } else {
            console.log("No events found to inspect.");
        }
    } catch (err) {
        console.error("FAIL:", err.message);
    }
}
checkFederationLogos();
