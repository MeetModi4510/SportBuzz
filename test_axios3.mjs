import https from 'https';
const req = https.request({
  hostname: 'livescore6.p.rapidapi.com',
  path: '/competitions/get-table?CompId=734',
  method: 'GET',
  headers: {
    'x-rapidapi-host': 'livescore6.p.rapidapi.com',
    'x-rapidapi-key': '8ff59ea88amshe58afcab9114126p143f30jsn45de62fd85e0'
  }
}, (res) => {
  let data = '';
  res.on('data', d => data += d);
  res.on('end', () => console.log(data.substring(0, 1000)));
});
req.end();
