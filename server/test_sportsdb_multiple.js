import axios from 'axios';

async function testSportsDBVenues() {
    try {
        const countries = ['India', 'Australia', 'England'];
        
        for (const c of countries) {
            console.log(`\nFetching Cricket teams in ${c}...`);
            const url = `https://www.thesportsdb.com/api/v1/json/3/search_all_teams.php?s=Cricket&c=${c}`;
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
            
            console.log(`Found ${venues.size} venues for ${c}!`);
            console.log(Array.from(venues.keys()).slice(0, 3));
        }
    } catch(e) {
        console.log("Error:", e.message);
    }
}
testSportsDBVenues();
