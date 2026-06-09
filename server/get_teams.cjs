const mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/SportBuzz').then(async () => {
    const db = mongoose.connection.db;
    const matches = db.collection('footballmatches');
    const teams = await matches.find({ 'league.id': { $in: [39, 140, 61, 78, 135, 253, 307, 144, 88, 323, 2, 3, 848] } }).toArray();
    const teamNames = new Set();
    teams.forEach(m => {
        if (m.teams && m.teams.home && m.teams.home.name) teamNames.add(m.teams.home.name.toLowerCase());
        if (m.teams && m.teams.away && m.teams.away.name) teamNames.add(m.teams.away.name.toLowerCase());
    });
    console.log(JSON.stringify(Array.from(teamNames).filter(Boolean)));
    mongoose.disconnect();
});
