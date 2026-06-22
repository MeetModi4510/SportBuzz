const axios = require('axios');
const cheerio = require('cheerio');

async function check() {
  const res = await axios.get('https://www.fotmob.com/leagues/77/overview/world-cup');
  const $ = cheerio.load(res.data);
  const nextData = $('#__NEXT_DATA__').html();
  if(nextData) {
    console.log('Includes Team of the Week?', nextData.includes('teamOfTheWeek'));
    if (nextData.includes('Ayari')) console.log('Includes Ayari!');
    const json = JSON.parse(nextData);
    
    // Recursive search
    const searchForKeys = (obj, path) => {
        if(!obj || typeof obj !== 'object') return;
        
        if(obj.teamOfTheWeek) {
            console.log('Found teamOfTheWeek at', path);
            console.log(JSON.stringify(obj.teamOfTheWeek).substring(0, 500));
        }
        
        if(obj.name && obj.name === 'Mbappé') {
            console.log('Found Mbappé at', path);
        }
        
        Object.keys(obj).forEach(k => {
            searchForKeys(obj[k], path + '.' + k);
        });
    };
    searchForKeys(json, 'json');
  }
}
check();
