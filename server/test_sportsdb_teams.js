import axios from 'axios';

async function testSportsDBTeams() {
    try {
        console.log("Fetching Cricket teams in India...");
        const url = 'https://www.thesportsdb.com/api/v1/json/3/search_all_teams.php?s=Cricket&c=India';
        const res = await axios.get(url);
        
        const teams = res.data.teams || [];
        const venues = new Map();
        
        teams.forEach(t => {
            if (t.strStadium) {
                venues.set(t.strStadium, {
                    name: t.strStadium,
                    location: t.strStadiumLocation,
                    capacity: t.intStadiumCapacity,
                    image: t.strStadiumThumb
                });
            }
        });
        
        console.log(`Found ${venues.size} venues!`);
        console.log(Array.from(venues.values()).slice(0, 5));
    } catch(e) {
        console.log("Error:", e.message);
    }
}
testSportsDBTeams();
