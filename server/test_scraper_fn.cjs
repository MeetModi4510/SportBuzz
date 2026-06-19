const { getPlayerProfile } = require('./services/cricbuzzScraperService.js');
getPlayerProfile(8502).then(res => {
    console.log(JSON.stringify(res, null, 2));
}).catch(console.log);
