const axios = require('axios');
axios.get('http://localhost:5000/api/cricket/scraped/match/118318/summary').then(r => console.log(JSON.stringify(r.data, null, 2))).catch(e => console.error(e.message));
