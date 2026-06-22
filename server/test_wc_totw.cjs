const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

async function testTOTW() {
  const url = 'https://www.fotmob.com/leagues/77/team-of-the-week/world-cup';
  try {
    const res = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const $ = cheerio.load(res.data);
    const nextDataStr = $('#__NEXT_DATA__').html();
    const json = JSON.parse(nextDataStr);
    
    // Recursive search
    const searchForKeys = (obj, path) => {
        if(!obj || typeof obj !== 'object') return;
        
        if(obj.teamOfTheWeek) {
            console.log('Found teamOfTheWeek at', path);
            fs.writeFileSync('totw_data.json', JSON.stringify(obj.teamOfTheWeek, null, 2));
            console.log('Saved to totw_data.json');
        }
        
        Object.keys(obj).forEach(k => {
            searchForKeys(obj[k], path + '.' + k);
        });
    };
    searchForKeys(json, 'json');

  } catch (e) {
    console.error('Error:', e.message);
  }
}
testTOTW();
