const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

async function getRaw() {
  try {
    const res = await axios.get('https://www.fotmob.com/leagues/77/team-of-the-week/world-cup', { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const $ = cheerio.load(res.data);
    const nextDataStr = $('#__NEXT_DATA__').html();
    fs.writeFileSync('totw_raw.json', JSON.stringify(JSON.parse(nextDataStr), null, 2));
    console.log('Saved raw JSON.');
  } catch (e) {
    console.error('Error:', e.message);
  }
}
getRaw();
