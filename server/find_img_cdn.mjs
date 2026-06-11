// Test what URLs livescore uses for player images
// by hitting their actual top-scorers API endpoint directly
import https from 'https';

function httpsGet(url) {
  return new Promise((resolve) => {
    const opts = new URL(url);
    const req = https.request({
      hostname: opts.hostname,
      path: opts.pathname + opts.search,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120',
        'Accept': '*/*',
        'x-rapidapi-host': 'livescore6.p.rapidapi.com',
        'x-rapidapi-key': 'ea08b9a9d5msh0ce1b811a3294e7p19b61bjsnb06b82498cf2'
      }
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    });
    req.on('error', () => resolve({ status: 'ERR', data: '' }));
    req.end();
  });
}

// Test various CDN patterns for the imageUrl "29179241.png"
const mediaId = '29179241';
const playerId = '15419';

const cdnTests = [
  `https://lsm-static-prod.livescore.com/medium/${mediaId}.png`,
  `https://lsm-static-prod.livescore.com/medium/api/${mediaId}.png`,
  `https://lsm-static-prod.livescore.com/img/${mediaId}.png`,
  // try with different domains
  `https://cdn.livescore-api.com/${mediaId}.png`,
  `https://apiv2.allsportsapi.com/logo/player_${playerId}.jpg`,
  // from RapidAPI livescore6 description
  `https://lsm-static-prod.livescore.com/high/${mediaId}.png`,
];

for (const url of cdnTests) {
  const r = await fetch(url, { headers: { 'Referer': 'https://www.livescore.com/' } }).catch(() => ({ status: 'ERR', headers: { get: () => null } }));
  console.log(r.status, url.split('//')[1]?.slice(0, 70));
}

// Also check the RapidAPI docs endpoint — maybe there's a dedicated image endpoint
const docsResult = await httpsGet('https://livescore6.p.rapidapi.com/players/detail?playerId=15419');
console.log('\nPlayer detail status:', docsResult.status);
console.log('Body sample:', docsResult.data?.slice(0, 500));
