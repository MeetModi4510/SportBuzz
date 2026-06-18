import axios from 'axios';
import fs from 'fs';

const url = 'https://www.cricbuzz.com/live-cricket-full-commentary/129563/eng-vs-nz-2nd-test-new-zealand-tour-of-england-2026';
const headers = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,*/*',
  'Referer': 'https://www.cricbuzz.com/'
};

try {
  const res = await axios.get(url, { headers, timeout: 15000 });
  const html = res.data;
  
  fs.writeFileSync('cb_full_comm.html', html);
  console.log('Saved to cb_full_comm.html');
  
  // Find key objects
  const keywords = ['commentaryList', 'matchPreviewFullComm', 'innings', 'over_num', 'ball_nbr'];
  keywords.forEach(k => {
      console.log(`Keyword '${k}' occurrences:`, html.split(k).length - 1);
  });
} catch (e) {
  console.error(e.message);
}
