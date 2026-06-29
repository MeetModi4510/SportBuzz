const axios = require('axios');
const titles = ['MA Chidambaram Stadium', 'Arun Jaitley Stadium', 'Rajiv Gandhi International Stadium', 'VCA Stadium'].join('|');
axios.get(`https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(titles)}&prop=pageimages&format=json&pithumbsize=500`, {headers: {'User-Agent': 'SportBuzz/1.0'}}).then(r => console.log(JSON.stringify(r.data, null, 2)));
