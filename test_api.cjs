const axios = require('axios');
const API_KEY = '675d4ba0167ac198b14ffffc77a7720b';
const API_HOST = 'v3.football.api-sports.io';
const client = axios.create({
  baseURL: `https://${API_HOST}`,
  headers: {
    'x-rapidapi-host': API_HOST,
    'x-rapidapi-key': API_KEY,
    'x-apisports-key': API_KEY,
  },
});
client.get('/fixtures', { params: { live: 'all' } }).then(res => console.log('Data:', Object.keys(res.data), res.data.errors, res.data.response?.length)).catch(err => console.error(err.response?.data || err.message));
