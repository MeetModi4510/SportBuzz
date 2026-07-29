const axios = require('axios');
const cheerio = require('cheerio');
axios.get('https://www.cricbuzz.com/live-cricket-scorecard/157230/match', { headers: { 'User-Agent': 'Mozilla/5.0' } })
  .then(r => {
    const $ = cheerio.load(r.data);
    $('[id^="team-"][id*="-innings-"]').each((_, el) => {
      console.log($(el).text().replace(/\s+/g, ' '));
      const lastBold = $(el).find('.font-bold').last().text().trim();
      console.log('Last bold:', lastBold);
      
      const scoreMatch = lastBold.match(/^(\d+)-(\d+)$/);
      console.log('Score Match:', scoreMatch);
    });
  })
  .catch(console.error);
