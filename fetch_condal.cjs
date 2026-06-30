const https = require('https');
const options = {
  hostname: 'en.wikipedia.org',
  path: '/wiki/CD_Condal',
  headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
};
https.get(options, (res) => {
    let data = '';
    res.on('data', (c) => data += c);
    res.on('end', () => {
        const matches = data.match(/<img[^>]+src=["'](\/\/[^"']+)["']/g);
        console.log("Images: ", matches);
    });
});
