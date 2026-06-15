import axios from 'axios';

async function findAthleteAnyLeague(id) {
    const leagues = ['eng.1', 'esp.1', 'ita.1', 'ger.1', 'fra.1', 'uefa.champions', 'uefa.europa', 'fifa.world', 'mex.1', 'ned.1', 'por.1'];
    
    try {
        const result = await Promise.any(
            leagues.map(async (league) => {
                const url = `https://site.web.api.espn.com/apis/common/v3/sports/soccer/${league}/athletes/${id}`;
                const res = await axios.get(url, { timeout: 5000 });
                return { league, data: res.data };
            })
        );
        console.log(`Success! Found athlete ${id} in league ${result.league}:`, result.data.athlete.displayName);
    } catch (e) {
        console.log(`Athlete ${id} not found in any checked league`);
    }
}

findAthleteAnyLeague(290043); // Arnau Tenas
findAthleteAnyLeague(45843); // Messi
