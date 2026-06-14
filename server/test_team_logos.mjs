import axios from 'axios';

async function testTeamLogo(teamName) {
    try {
        const url = `https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t=${encodeURIComponent(teamName)}`;
        const res = await axios.get(url, { timeout: 5000 });
        
        if (res.data && res.data.teams && res.data.teams.length > 0) {
            // Find the soccer team, usually National teams
            const team = res.data.teams.find(t => t.strSport === 'Soccer' && (t.strCountry === teamName || t.strTeam === teamName));
            if (team) {
                console.log(`[SUCCESS] ${teamName} -> ${team.strBadge}`);
                return team.strBadge;
            } else {
                 console.log(`[FAIL] Found results for ${teamName}, but no matching Soccer team.`);
            }
        } else {
            console.log(`[FAIL] No team found for ${teamName}`);
        }
    } catch (e) {
        console.log(`[ERROR] ${teamName}:`, e.message);
    }
}

async function run() {
    await testTeamLogo("Brazil");
    await testTeamLogo("Germany");
    await testTeamLogo("Curaçao");
    await testTeamLogo("Morocco");
}

run();
