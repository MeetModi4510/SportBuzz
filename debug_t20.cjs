
const https = require('https');

const API_KEY = '10d3fca6-f7ac-476b-8b3f-f3b631a5d358';
// We need to find the match ID for England vs Nepal. Let's fetch current matches first.
const URL = `https://api.cricapi.com/v1/currentMatches?apikey=${API_KEY}&offset=0`;

console.log('Fetching current matches to find England vs Nepal...');

https.get(URL, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            console.log(JSON.stringify(json, null, 2));
        } catch (e) {
            console.error('Parse Error:', e);
        }
    });
}).on('error', (err) => {
    console.error('Request Error:', err);
});
