import axios from 'axios';

async function testPlayerApi() {
    try {
        const id = 45843; // Messi
        const url = `https://site.web.api.espn.com/apis/common/v3/sports/soccer/eng.1/athletes/${id}`;
        console.log("Fetching:", url);
        const res = await axios.get(url);
        
        console.log("Athlete data:", Object.keys(res.data.athlete));
        console.log("Athlete details:");
        console.log("displayHeight:", res.data.athlete.displayHeight);
        console.log("displayWeight:", res.data.athlete.displayWeight);
        console.log("displayDOB:", res.data.athlete.displayDOB);
        console.log("age:", res.data.athlete.age);
        console.log("birthPlace:", res.data.athlete.birthPlace);
        console.log("country:", res.data.athlete.country);
        console.log("position:", res.data.athlete.position?.name);
    } catch (e) {
        console.error("Error:", e.message);
    }
}

testPlayerApi();
