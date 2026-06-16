const axios = require('axios');

async function test() {
    try {
        const res = await axios.get('https://core.espnuk.org/v2/sports/cricket/teams?limit=500');
        const urls = res.data.items.map(i => i.$ref);
        console.log("Found ESPNcricinfo teams:", urls.length);
        
        // Fetch the first team to see if it has a logo
        const team1Res = await axios.get(urls[0]);
        console.log("Team 1:", team1Res.data.name, team1Res.data.logos);
        
        // Let's find Mumbai Indians
        for (const url of urls) {
            const teamRes = await axios.get(url);
            if (teamRes.data.name.includes('Mumbai Indians')) {
                console.log("Mumbai Indians:", teamRes.data.name, teamRes.data.logos);
                break;
            }
        }
    } catch(e) {
        console.log(e.message);
    }
}
test();
