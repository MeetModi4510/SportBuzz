const https = require('https');

function fetchTransfers(query) {
  return new Promise((resolve, reject) => {
    https.get(`https://www.fotmob.com/api/data/transfers?${query}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch(e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

(async () => {
  try {
    console.log('Fetching top transfers...');
    const top = await fetchTransfers('orderBy=lastModified&page=1&minFeeCurrency=EUR&transferType=top');
    console.log(`Top: ${top.transfers ? top.transfers.length : 0} items. Sample from/to:`, top.transfers ? `${top.transfers[0].fromClub} -> ${top.transfers[0].toClub}` : null);
    
    console.log('\nFetching Premier League (47)...');
    const pl = await fetchTransfers('leagueId=47&page=1&minFeeCurrency=EUR');
    console.log(`PL: ${pl.transfers ? pl.transfers.length : 0} items. Sample from/to:`, pl.transfers ? `${pl.transfers[0].fromClub} -> ${pl.transfers[0].toClub}` : null);

    console.log('\nFetching Arsenal (teamId 9825)...');
    const ars = await fetchTransfers('teamId=9825&page=1&minFeeCurrency=EUR');
    console.log(`Arsenal: ${ars.transfers ? ars.transfers.length : 0} items. Sample from/to:`, ars.transfers ? `${ars.transfers[0].fromClub} -> ${ars.transfers[0].toClub}` : null);

    // Save one payload to see the shape
    const fs = require('fs');
    fs.writeFileSync('transfer_payload.json', JSON.stringify(top.transfers[0], null, 2));

  } catch(e) {
    console.log('Error:', e.message);
  }
})();
