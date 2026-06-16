const axios = require('axios');

async function test() {
    const teams = ['India U19', 'Mumbai', 'North Mumbai Panthers', 'Rajasthan Royals', 'Rest of India', 'India A', 'India'];
    for (const team of teams) {
        try {
            const res = await axios.get(`https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t=${encodeURIComponent(team)}`);
            if (res.data && res.data.teams) {
                const cricketTeam = res.data.teams.find(t => t.strSport?.toLowerCase() === 'cricket');
                if (cricketTeam) {
                    console.log(`[SUCCESS] ${team} -> ${cricketTeam.strBadge}`);
                } else {
                    console.log(`[NO CRICKET TEAM] ${team}`);
                }
            } else {
                console.log(`[NOT FOUND] ${team}`);
            }
        } catch(e) {
            console.log(`[ERROR] ${team}: ${e.message}`);
        }
    }
}
test();
