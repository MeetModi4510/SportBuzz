import axios from 'axios';

async function testPlayerApi() {
    try {
        // Fetch a match summary to see the athlete links
        // We need a recent match. Let's fetch the scoreboard first.
        const scoreRes = await axios.get('https://site.api.espn.com/apis/site/v2/sports/soccer/esp.1/scoreboard');
        if (scoreRes.data.events.length > 0) {
            const matchId = scoreRes.data.events[0].id;
            console.log("Match ID:", matchId);
            
            const summaryRes = await axios.get(`https://site.api.espn.com/apis/site/v2/sports/soccer/esp.1/summary?event=${matchId}`);
            
            const rosters = summaryRes.data.rosters;
            if (rosters && rosters.length > 0) {
                const player = rosters[0].roster[0];
                console.log("Player name:", player.athlete.displayName);
                console.log("Player links:", JSON.stringify(player.athlete.links, null, 2));
            } else {
                console.log("No rosters found");
            }
        }
    } catch (e) {
        console.error("ERROR:", e.message);
    }
}

testPlayerApi();
