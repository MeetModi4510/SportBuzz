const axios = require('axios');

async function testApi() {
  try {
    const res = await axios.get('https://www.fotmob.com/api/leagues?id=77');
    console.log('API Keys:', Object.keys(res.data));
    if (res.data.teamOfTheWeek) {
        console.log('HAS TOTW!', Object.keys(res.data.teamOfTheWeek));
        console.log(JSON.stringify(res.data.teamOfTheWeek).substring(0, 500));
    } else {
        console.log('NO TOTW in API directly');
    }
    
    // Check all tabs to see if it's somewhere else
    Object.keys(res.data).forEach(key => {
        if (typeof res.data[key] === 'object' && res.data[key] !== null) {
            console.log(`Checking ${key}... keys:`, Object.keys(res.data[key]));
        }
    });

  } catch(e) {
    console.error('Err', e.message);
  }
}
testApi();
