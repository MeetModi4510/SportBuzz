const axios = require('axios');
axios.get('http://localhost:5000/api/football/transfers')
    .then(r => {
        console.log('Fetched:', r.data.data.length, 'transfers');
        console.log('Popular:', r.data.data.filter(t => t.isPopular).length);
        console.log('Popular names:', r.data.data.filter(t => t.isPopular).map(t=>t.playerName).slice(0, 5));
    })
    .catch(console.error);
