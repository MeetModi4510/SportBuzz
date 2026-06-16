import axios from 'axios';

async function testTeamRolesNextJs() {
    try {
        const res = await axios.get('https://www.cricbuzz.com/cricket-team/india/2/players', {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        
        const html = res.data;
        const matches = html.match(/\\"player\\":(\[\{.*?\}\])/g);
        if (matches) {
            console.log("Found matches:", matches.length);
            console.log(matches[0].substring(0, 500));
        } else {
            console.log("No player JSON found in NextJS payload.");
            // Print all JSON-like objects with player names
            const altMatch = html.match(/\{[^}]*\\"name\\":\\"Shubman Gill\\"[^}]*\}/);
            if (altMatch) console.log("Found Gill:", altMatch[0]);
        }

    } catch(e) { console.error(e); }
}
testTeamRolesNextJs();
