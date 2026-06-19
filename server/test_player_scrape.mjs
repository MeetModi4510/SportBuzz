import axios from 'axios';

async function testApi() {
  const urls = [
      'https://www.cricbuzz.com/api/player/9838',
      'https://www.cricbuzz.com/api/player/profile/9838',
      'https://m.cricbuzz.com/api/player/9838',
      'https://cricbuzz.com/api/player/9838'
  ];
  for(let url of urls) {
      try {
          const res = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
          console.log(url, 'Success', Object.keys(res.data));
      } catch(e) {
          console.log(url, 'Failed', e.response?.status);
      }
  }
}

testApi();
