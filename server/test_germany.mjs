import axios from 'axios';

async function checkGermanyMatch() {
    try {
        const res = await axios.get('https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard');
        const events = res.data.events || [];
        
        const germanyEvent = events.find(e => e.name.includes('Germany'));
        if (germanyEvent) {
            console.log("FOUND GERMANY MATCH:");
            console.log("Name:", germanyEvent.name);
            console.log("Status Type Name:", germanyEvent.status.type.name);
            console.log("Status Type State:", germanyEvent.status.type.state);
            console.log("Status Type Detail:", germanyEvent.status.type.detail);
        } else {
            console.log("Germany match not found in fifa.world scoreboard right now!");
        }
        
    } catch (e) {
        console.error("FAIL:", e.message);
    }
}

checkGermanyMatch();
