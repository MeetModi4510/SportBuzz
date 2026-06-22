const axios = require('axios');
const cheerio = require('cheerio');

async function testTOTW() {
  const url = 'https://www.fotmob.com/leagues/47/overview/premier-league';
  try {
    const res = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const $ = cheerio.load(res.data);
    const nextDataStr = $('#__NEXT_DATA__').html();
    const json = JSON.parse(nextDataStr);
    const totw = json?.props?.pageProps?.overview?.teamOfTheWeek;
    if (totw) {
        console.log('YES! Found TOTW for Premier League!');
    } else {
        console.log('No TOTW in PL overview either.');
    }
  } catch (e) {
    console.error('Error:', e.message);
  }
}
testTOTW();
