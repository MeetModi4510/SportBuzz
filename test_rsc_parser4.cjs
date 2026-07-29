const axios = require('axios');
axios.get('https://www.cricbuzz.com/live-cricket-scorecard/118318/match', { headers: { 'User-Agent': 'Mozilla/5.0' } }).then(r => console.log(r.data.substring(0, 2000))).catch(e => console.error(e.message));
