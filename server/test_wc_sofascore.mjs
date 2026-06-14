import axios from 'axios';

const RAPIDAPI_KEY = '85fb58db70msh50c5add33399bccp10e19ajsn6083f7bc3e30';
const RAPIDAPI_HOST = 'sofascore.p.rapidapi.com';
const BASE = 'https://sofascore.p.rapidapi.com';

const headers = {
    'x-rapidapi-key': RAPIDAPI_KEY,
    'x-rapidapi-host': RAPIDAPI_HOST,
    'Content-Type': 'application/json'
};

async function checkLiveMatches() {
    try {
        console.log("Fetching /categories/list-live...");
        const res = await axios.get(`${BASE}/categories/list-live?sport=football`, { headers });
        const events = res.data.events || [];
        
        console.log(`Found ${events.length} live events.`);
        if (events.length > 0) {
            events.slice(0, 5).forEach(e => {
                console.log(`- ${e.homeTeam?.name} vs ${e.awayTeam?.name} | Tournament: ${e.tournament?.name} (ID: ${e.tournament?.uniqueTournament?.id})`);
            });
        }
    } catch (err) {
        console.error("FAIL:", err.message);
    }
}

checkLiveMatches();
