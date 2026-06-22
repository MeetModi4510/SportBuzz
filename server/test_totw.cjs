const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

async function testTotw() {
  try {
    const res = await axios.get('https://www.fotmob.com/leagues/77/overview/world-cup');
    const $ = cheerio.load(res.data);
    const nextDataStr = $('#__NEXT_DATA__').html();
    if(nextDataStr) {
      const json = JSON.parse(nextDataStr);
      console.log('Props keys:', Object.keys(json.props.pageProps));
      
      const league = json.props.pageProps.league;
      if (league && league.details && league.details.faqJSONLD) {
        // Just checking what's there
      }
      
      console.log('League keys:', Object.keys(league));
      
      // Look for any team of the week data
      if (league && league.teamOfTheWeek) {
        console.log('GOT TOTW directly on league');
        console.log(JSON.stringify(league.teamOfTheWeek).substring(0, 500));
      } else {
        console.log('No teamOfTheWeek found on league directly.');
      }
      
    }
  } catch (err) {
    console.error('Error fetching', err.message);
  }
}

testTotw();
