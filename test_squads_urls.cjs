const axios = require('axios');
async function test() {
    try {
        const res = await axios.get('https://www.cricbuzz.com/cricket-match-squads/121857/match', {
            headers: { 'User-Agent': 'Mozilla/5.0', 'RSC': '1', 'x-nextjs-data': '1' }
        });
        console.log("Success for 121857 cricket-match-squads");
    } catch (e) {
        console.log("Failed 121857 cricket-match-squads:", e.response ? e.response.status : e.message);
    }
    
    try {
        const res = await axios.get('https://www.cricbuzz.com/live-cricket-squads/121857/match', {
            headers: { 'User-Agent': 'Mozilla/5.0', 'RSC': '1', 'x-nextjs-data': '1' }
        });
        console.log("Success for 121857 live-cricket-squads");
    } catch (e) {
        console.log("Failed 121857 live-cricket-squads:", e.response ? e.response.status : e.message);
    }
}
test();
