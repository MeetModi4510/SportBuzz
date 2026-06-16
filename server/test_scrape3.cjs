const axios = require('axios');
const cheerio = require('cheerio');

axios.get('https://www.cricbuzz.com/cricket-team/england/9/players', { headers: { 'User-Agent': 'Mozilla/5.0' }})
  .then(res => {
      const $ = cheerio.load(res.data);
      console.log($('title').text());
      const players = [];
      $('a').each((i, el) => {
          const href = $(el).attr('href');
          if (href && href.includes('/profiles/')) {
              players.push($(el).text().trim());
          }
      });
      console.log('PLAYERS:', players.length, players.slice(0, 5));
  }).catch(console.log);
