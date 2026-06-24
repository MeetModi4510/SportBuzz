const fs = require('fs');
const axios = require('axios');
const cheerio = require('cheerio');
const HEADERS = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'};

async function getSquad() {
  try {
      const res = await axios.get('https://www.cricbuzz.com/cricket-team/india/2/players', {headers: HEADERS});
      const $ = cheerio.load(res.data);
      const players = [];
      $('a.cb-col-50').each((i, el) => {
         players.push($(el).text().trim());
      });
      console.log('Players found using cb-col-50:', players.length, players.slice(0, 5));

      const players2 = [];
      $('a.text-hvr-underline').each((i, el) => {
          const t = $(el).text().trim();
          if(t) players2.push(t);
      });
      console.log('Players found using text-hvr-underline:', players2.length, players2.slice(0, 5));
      
      const players3 = [];
      $('.cb-col.cb-col-50').each((i, el) => {
          const t = $(el).find('a').text().trim();
          if(t) players3.push(t);
      });
      console.log('Players found using .cb-col-50 find a:', players3.length, players3.slice(0, 5));

  } catch(e) {
      console.error(e.message);
  }
}
getSquad();
