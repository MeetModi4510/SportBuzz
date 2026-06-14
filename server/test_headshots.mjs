import axios from 'axios';

async function testPlayerImageUrls() {
    try {
        const matchId = '760419';
        const res = await axios.get(`https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/summary`, { params: { event: matchId } });
        
        const rosters = res.data.rosters;
        if (!rosters || rosters.length === 0) {
            console.log("No rosters found.");
            return;
        }

        const team = rosters[0]; // first team (could be Brazil or Morocco)
        console.log("Team:", team.team.name);
        const alisson = team.roster[0]; // just grab the first player
        const id = alisson.athlete.id;
        
        console.log(`Player: ${alisson.athlete.displayName} (ID: ${id})`);
        console.log("Headshot object:", alisson.athlete.headshot?.href || 'None');
        
        const urlsToTest = [
            `https://a.espncdn.com/combiner/i?img=/i/headshots/soccer/players/full/${id}.png`,
            `https://a.espncdn.com/i/headshots/soccer/players/full/${id}.png`,
            alisson.athlete.headshot?.href || 'NO_HEADSHOT_OBJECT'
        ];
        
        for (const url of urlsToTest) {
            if (url === 'NO_HEADSHOT_OBJECT') continue;
            try {
                await axios.head(url);
                console.log(`[OK] ${url}`);
            } catch (err) {
                console.log(`[404] ${url}`);
            }
        }
        
    } catch (e) {
        console.error("FAIL:", e.message);
    }
}

testPlayerImageUrls();
