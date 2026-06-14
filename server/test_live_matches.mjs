import axios from 'axios';

async function testLiveMatches() {
    try {
        console.log("Fetching scoreboard...");
        const res = await axios.get('https://site.api.espn.com/apis/site/v2/sports/soccer/scoreboard');
        
        const events = res.data.events || [];
        console.log(`Found ${events.length} events today.`);
        
        const liveEvents = [];
        const otherEvents = [];
        
        for (const event of events) {
            const status = event.status?.type?.state;
            const name = event.name;
            const detail = event.status?.type?.detail;
            
            if (status === 'in') {
                liveEvents.push(`${name} (Status: ${status}, Detail: ${detail})`);
            } else {
                if (name.includes('Germany') || name.includes('Curaçao') || name.includes('Curacao')) {
                    otherEvents.push(`--> FOUND GERMANY: ${name} (Status: ${status}, Detail: ${detail})`);
                }
            }
        }
        
        console.log("\n--- LIVE MATCHES ---");
        if (liveEvents.length > 0) {
            liveEvents.forEach(e => console.log(e));
        } else {
            console.log("No matches have state === 'in'");
        }
        
        console.log("\n--- OTHER NOTABLE MATCHES ---");
        otherEvents.forEach(e => console.log(e));
        
    } catch (e) {
        console.error("FAIL:", e.message);
    }
}

testLiveMatches();
