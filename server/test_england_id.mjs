import axios from 'axios';

async function findEngland() {
    try {
        const res = await axios.get('https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=20260610-20260620');
        const events = res.data.events || [];
        
        events.forEach(e => {
            const home = e.competitions[0]?.competitors.find(c => c.homeAway === 'home')?.team;
            const away = e.competitions[0]?.competitors.find(c => c.homeAway === 'away')?.team;
            
            if (home.name === 'England') console.log("England ID:", home.id);
            if (away.name === 'England') console.log("England ID:", away.id);
        });
    } catch (err) {
        console.error("FAIL:", err.message);
    }
}
findEngland();
