const axios = require('axios');
axios.get('https://www.fotmob.com/api/data/transfers?orderBy=lastModified&page=1&minFeeCurrency=EUR&transferType=top&minFee=20000000', {
    headers: { 'User-Agent': 'Mozilla/5.0' }
}).then(r => {
    r.data.transfers.slice(0, 10).forEach(t => {
        console.log(`- ${t.name} (${t.fromClub} -> ${t.toClub}) | Fee: ${t.fee?.feeText || t.fee?.localizedFeeText}`);
    });
}).catch(console.error);
