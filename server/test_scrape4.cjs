const axios = require('axios');
const cheerio = require('cheerio');

axios.get('https://www.cricbuzz.com/cricket-team', { headers: { 'User-Agent': 'Mozilla/5.0' }})
  .then(res => {
      const $ = cheerio.load(res.data);
      $('a').each((i, el) => {
          const href = $(el).attr('href');
          if (href && href.includes('/cricket-team/')) {
              console.log(href);
          }
      });
  }).catch(console.log);
