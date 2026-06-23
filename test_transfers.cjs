const https = require('https');
const fs = require('fs');

https.get('https://www.fotmob.com/transfers', {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const match = data.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
      if (match && match[1]) {
        const json = JSON.parse(match[1]);
        fs.writeFileSync('fotmob_transfers_next_data.json', JSON.stringify(json, null, 2));
        console.log('Successfully saved to fotmob_transfers_next_data.json');
        
        // Let's inspect the keys
        if (json.props && json.props.pageProps) {
          console.log('pageProps keys:', Object.keys(json.props.pageProps));
          if (json.props.pageProps.fallback) {
             const fallbackKeys = Object.keys(json.props.pageProps.fallback);
             console.log('fallback keys:', fallbackKeys);
          }
        }
      } else {
        console.log('__NEXT_DATA__ not found');
      }
    } catch(e) {
      console.log('Error parsing JSON:', e.message);
    }
  });
}).on('error', console.error);
