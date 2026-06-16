const axios = require('axios');
const cheerio = require('cheerio');

axios.get('https://www.cricbuzz.com/cricket-team/england/1/players', { headers: { 'User-Agent': 'Mozilla/5.0' }})
  .then(res => {
      const $ = cheerio.load(res.data);
      const players = [];
      let currentRole = 'Top order Batter';

      $('span, a').each((i, el) => {
          const tagName = el.tagName.toLowerCase();
          
          if (tagName === 'span') {
              const text = $(el).text().trim().toUpperCase();
              if (text === 'BATSMEN' || text === 'BATTER') currentRole = 'Top order Batter';
              else if (text === 'ALL ROUNDER') currentRole = 'Allrounder';
              else if (text === 'WICKET KEEPER') currentRole = 'Wicketkeeper Batter';
              else if (text === 'BOWLER') currentRole = 'Bowler';
          } 
          else if (tagName === 'a') {
              const href = $(el).attr('href');
              if (href && href.includes('/profiles/')) {
                  const name = $(el).text().trim();
                  if (name && name !== 'Profiles' && name !== 'Players') {
                      players.push(name);
                  }
              }
          }
      });
      console.log('PLAYERS:', players.length, players.slice(0, 5));
  });
