import axios from 'axios';

async function testESPN() {
    try {
        console.log("Fetching English Premier League scoreboard from ESPN...");
        
        // ESPN Hidden API Endpoint for English Premier League (eng.1)
        const url = 'https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/scoreboard';
        
        const res = await axios.get(url);
        const data = res.data;
        
        console.log("\n=== ESPN API TEST SUCCESSFUL ===");
        console.log("League:", data.leagues?.[0]?.name);
        console.log("Season:", data.leagues?.[0]?.season?.year);
        
        const events = data.events || [];
        console.log(`\nFound ${events.length} matches in the scoreboard.`);
        
        if (events.length > 0) {
            console.log("\nSample Match:");
            const match = events[0];
            const comp = match.competitions[0];
            const home = comp.competitors.find(c => c.homeAway === 'home');
            const away = comp.competitors.find(c => c.homeAway === 'away');
            
            console.log(`${home.team.name} vs ${away.team.name}`);
            console.log(`Status: ${match.status.type.detail}`);
            console.log(`Home Logo: ${home.team.logo}`);
            console.log(`Away Logo: ${away.team.logo}`);
        }
    } catch (err) {
        console.error("ESPN API TEST FAILED:", err.message);
    }
}

testESPN();
