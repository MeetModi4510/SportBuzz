import axios from 'axios';

async function testEspnDates() {
    try {
        console.log("Testing ESPN date ranges...");
        // 5 day window
        const url = 'https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/scoreboard?dates=20240518-20240522';
        const res = await axios.get(url);
        const events = res.data.events || [];
        console.log(`Found ${events.length} matches for date range.`);
        if (events.length > 0) {
            console.log("Dates span:");
            console.log("First:", events[0].date);
            console.log("Last:", events[events.length-1].date);
        }
    } catch (err) {
        console.error("FAIL:", err.message);
    }
}
testEspnDates();
