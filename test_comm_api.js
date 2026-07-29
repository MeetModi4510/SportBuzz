import axios from 'axios';

const matchId = 129480;
const url = `https://www.cricbuzz.com/api/cricket-match/commentary/${matchId}?InningsType=1&PageNumber=0`;

console.log('Testing URL:', url);

try {
  const r = await axios.get(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'application/json, text/plain, */*',
      'Referer': `https://www.cricbuzz.com/live-cricket-full-commentary/${matchId}/match`,
      'x-requested-with': 'XMLHttpRequest'
    },
    timeout: 15000,
    responseType: 'text'
  });
  console.log('Status:', r.status);
  console.log('Content-Type:', r.headers['content-type']);
  // Print first 1000 chars
  const text = r.data;
  console.log('Response length:', text.length);
  console.log('First 1000 chars:', text.substring(0, 1000));
} catch(e) {
  console.error('Error:', e.response?.status, e.message);
  if (e.response?.data) {
    console.log('Response:', String(e.response.data).substring(0, 500));
  }
}
