import axios from 'axios';

async function researchESPN() {
    try {
        console.log("Fetching EPL scoreboard...");
        const sbRes = await axios.get('https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/scoreboard');
        const events = sbRes.data.events || [];
        
        if (events.length === 0) {
            console.log("No events found.");
            return;
        }
        
        const matchId = events[0].id;
        console.log(`\nFetching summary for Match ID: ${matchId}`);
        
        const summaryUrl = `https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/summary?event=${matchId}`;
        const sumRes = await axios.get(summaryUrl);
        const data = sumRes.data;
        
        console.log("\n=== DATA VERIFICATION ===");
        
        // 1. Match Summary (Boxscore / Header)
        console.log("Match Header:", data.header ? "AVAILABLE" : "MISSING");
        
        // 2. Key Events
        console.log("Key Events (Plays/Commentary):", data.keyEvents ? `AVAILABLE (${data.keyEvents.length} events)` : "MISSING");
        
        // 3. Stats
        console.log("Stats (Boxscore Teams):", data.boxscore?.teams ? "AVAILABLE" : "MISSING");
        if (data.boxscore?.teams) {
            console.log("  Sample Stat:", data.boxscore.teams[0].statistics?.[0]?.name);
        }
        
        // 4. Lineups
        console.log("Lineups (Rosters):", data.rosters ? "AVAILABLE" : "MISSING");
        if (data.rosters && data.rosters.length > 0) {
            console.log("  Home Team Roster size:", data.rosters[0].roster?.length);
            console.log("  Player Photo exists:", !!data.rosters[0].roster?.[0]?.athlete?.headshot?.href);
            console.log("  Substitutes exists:", !!data.rosters[0].roster?.[0]?.subbedIn);
        }
        
    } catch (err) {
        console.error("FAIL:", err.message);
    }
}

researchESPN();
