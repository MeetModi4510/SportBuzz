import axios from 'axios';

async function testEspnAllLeagues() {
    try {
        console.log("Fetching fifa.world scoreboard...");
        try {
            const fifaRes = await axios.get('https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=20260610-20260620');
            const fifaEvents = fifaRes.data.events || [];
            console.log(`Found ${fifaEvents.length} events in fifa.world.`);
            fifaEvents.forEach(e => {
                const home = e.competitions[0]?.competitors.find(c => c.homeAway === 'home')?.team?.name;
                const away = e.competitions[0]?.competitors.find(c => c.homeAway === 'away')?.team?.name;
                console.log(`- ${home} vs ${away}`);
            });
        } catch(e) { console.error("fifa.world fail:", e.message) }
        
        console.log("\nFetching fifa.friendly scoreboard...");
        try {
            const friendlyRes = await axios.get('https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.friendly/scoreboard?dates=20260610-20260620');
            const friendlyEvents = friendlyRes.data.events || [];
            console.log(`Found ${friendlyEvents.length} events in fifa.friendly.`);
            friendlyEvents.forEach(e => {
                const home = e.competitions[0]?.competitors.find(c => c.homeAway === 'home')?.team?.name;
                const away = e.competitions[0]?.competitors.find(c => c.homeAway === 'away')?.team?.name;
                console.log(`- ${home} vs ${away} (Date: ${e.date})`);
            });
        } catch(e) { console.error("fifa.friendly fail:", e.message) }

    } catch (err) {
        console.error("FAIL:", err.message);
    }
}
testEspnAllLeagues();
