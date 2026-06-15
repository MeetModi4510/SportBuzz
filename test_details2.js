import axios from 'axios';

async function testDetails() {
    try {
        // Fetch EPL scoreboard to get a recent match
        const scoreRes = await axios.get('https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/scoreboard');
        const eventId = scoreRes.data.events[0].id;
        console.log("Testing Event ID:", eventId);
        
        const res = await axios.get(`https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/summary?event=${eventId}`);
        const details = res.data.details || [];
        const keyEvents = res.data.keyEvents || [];
        
        const eventTypes = new Set(details.map(d => d.type?.text));
        console.log("Event types in details:", Array.from(eventTypes));
        console.log("Total details events:", details.length);
        
        const keyEventTypes = new Set(keyEvents.map(d => d.type?.text));
        console.log("Event types in keyEvents:", Array.from(keyEventTypes));
        console.log("Total key events:", keyEvents.length);
    } catch (e) {
        console.error(e.message);
    }
}

testDetails();
