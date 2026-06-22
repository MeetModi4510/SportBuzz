const axios = require('axios');

async function testTots() {
  try {
    const res = await axios.get('https://www.fotmob.com/api/tots?leagueId=77');
    console.log('TOTS Data:', JSON.stringify(res.data).substring(0, 500));
  } catch(e) {
    console.error('Err', e.message);
  }
}
testTots();
