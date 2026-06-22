fetch('https://www.fotmob.com/players/30981/player').then(r=>r.text()).then(t=>{ 
    const m=t.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/); 
    const d=JSON.parse(m[1]).props.pageProps.fallback['player:30981']; 
    const fs = require('fs');
    fs.writeFileSync('messi_seasons.json', JSON.stringify(d.statSeasons, null, 2));
});
