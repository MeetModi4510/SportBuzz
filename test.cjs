const axios = require('axios');
axios.get('https://www.fotmob.com/players/273300/player', {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
}).then(r => {
    const match = r.data.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
    if (match) {
        const d = JSON.parse(match[1]);
        const s = d.props.pageProps.fallback['player:273300'].statSeasons;
        console.log(JSON.stringify(s.map(x => ({
            seasonName: x.seasonName,
            tournaments: x.tournaments.map(t => ({
                name: t.name,
                entryId: t.entryId,
                tournamentId: t.tournamentId
            }))
        })), null, 2));
    }
}).catch(console.error);
