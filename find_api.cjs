const axios = require('axios');
axios.get('https://www.cricbuzz.com/live-cricket-graphs/148415/match').then(res => {
    require('fs').writeFileSync('cricbuzz_graphs.html', res.data);
    console.log('Saved to cricbuzz_graphs.html');
}).catch(console.error);
