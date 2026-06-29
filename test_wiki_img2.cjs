const axios = require('axios');
axios.get(`https://en.wikipedia.org/w/api.php?action=query&titles=MA%20Chidambaram%20Stadium&prop=revisions&rvprop=content&format=json`, {headers: {'User-Agent': 'SportBuzz/1.0'}}).then(r => console.log(Object.values(r.data.query.pages)[0].revisions[0]['*'].substring(0, 500)));
