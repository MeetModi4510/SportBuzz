import https from 'https';

const paths = [
  '/leagues/v2/get-table?Category=soccer&Ccd=world-cup-2026',
  '/competitions/get-table?CompId=734',
];

function testPath(path) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'livescore6.p.rapidapi.com',
      path: path,
      method: 'GET',
      headers: {
        'x-rapidapi-host': 'livescore6.p.rapidapi.com',
        'x-rapidapi-key': '8ff59ea88amshe58afcab9114126p143f30jsn45de62fd85e0'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        console.log(`=== ${path} | Status: ${res.statusCode} | Size: ${data.length} ===`);
        resolve();
      });
    });
    req.on('error', (e) => { console.log(`  Error: ${e.message}`); resolve(); });
    req.end();
  });
}

(async () => {
  for (const p of paths) {
    await testPath(p);
  }
})();
