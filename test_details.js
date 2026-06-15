import axios from 'axios';

async function testDetails() {
    try {
        const res = await axios.get('https://site.api.espn.com/apis/site/v2/sports/soccer/esp.1/summary?event=748515');
        const details = res.data.details || [];
        const eventTypes = new Set(details.map(d => d.type?.text));
        console.log("Event types in details:", Array.from(eventTypes));
        console.log("Total details events:", details.length);
        console.log("Total key events:", res.data.keyEvents?.length || 0);
    } catch (e) {
        console.error(e.message);
    }
}

testDetails();
