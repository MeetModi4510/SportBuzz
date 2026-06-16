import axios from 'axios';

async function testTeamRolesNextJs() {
    try {
        const res = await axios.get('https://www.cricbuzz.com/cricket-team/india/2/players', {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        
        const html = res.data;
        const shubmanIdx = html.indexOf('Shubman Gill');
        if (shubmanIdx > -1) {
            console.log("Context around Shubman Gill:");
            console.log(html.substring(Math.max(0, shubmanIdx - 200), shubmanIdx + 200));
        }

    } catch(e) { console.error(e); }
}
testTeamRolesNextJs();
