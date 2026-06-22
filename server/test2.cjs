const axios = require('axios');
const cheerio = require('cheerio');

async function check() {
  const res = await axios.get('https://www.fotmob.com/leagues/77/overview/world-cup');
  const $ = cheerio.load(res.data);
  const nextData = $('#__NEXT_DATA__').html();
  if(nextData) {
    console.log('Includes Team of the Week?', nextData.includes('teamOfTheWeek'));
    const json = JSON.parse(nextData);
    if(json.props.pageProps.overview && json.props.pageProps.overview.teamOfTheWeek) {
        console.log('Found it in overview!');
        console.log(JSON.stringify(json.props.pageProps.overview.teamOfTheWeek, null, 2).substring(0, 500));
    } else {
        console.log('Not in overview');
        // Let's search where it is
        const searchForKeys = (obj, path) => {
            if(!obj || typeof obj !== 'object') return;
            if(obj.teamOfTheWeek) {
                console.log('Found at', path);
            }
            Object.keys(obj).forEach(k => {
                searchForKeys(obj[k], path + '.' + k);
            });
        };
        searchForKeys(json, 'json');
    }
  }
}
check();
