import axios from 'axios';
import fs from 'fs';
async function run() {
  const response = await axios.get('https://www.fotmob.com/transfers', {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }
  });
  fs.writeFileSync('fotmob.html', response.data);
  console.log('Saved to fotmob.html');
  const match = response.data.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
  if (match) {
    fs.writeFileSync('next.json', match[1]);
    console.log('Saved next.json');
  }
}
run();
