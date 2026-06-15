async function fetchMatches() {
    const res = await fetch('https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/scoreboard');
    const data = await res.json();
    const eventId = data.events[0].id;
    console.log("Recent EPL match ID:", eventId);
    
    const res2 = await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/summary?event=${eventId}`);
    const data2 = await res2.json();
    if (data2.rosters) {
        const allKeys = new Set();
        data2.rosters.forEach(r => {
            r.roster.forEach(p => {
                if (p.stats) {
                    p.stats.forEach(s => allKeys.add(s.name));
                }
            })
        });
        console.log("All unique stat keys found in EPL match:", Array.from(allKeys).join(', '));
    }
}
fetchMatches();
