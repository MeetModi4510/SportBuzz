import axios from 'axios';
import fs from 'fs';

const url1 = 'https://www.cricbuzz.com/live-cricket-full-commentary/129563/nz-vs-eng-2nd-test-new-zealand-tour-of-england-2026';
const url2 = 'https://www.cricbuzz.com/live-cricket-scores/129563/nz-vs-eng-2nd-test-new-zealand-tour-of-england-2026';

const headers = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
  'Accept': 'text/html,*/*'
};

try {
  console.log('Fetching full-commentary...');
  const res1 = await axios.get(url1, { headers });
  console.log('291-7 in full-commentary:', res1.data.includes('291-7'));
  console.log('Jacob Bethell in full-commentary:', res1.data.split('Jacob Bethell').length - 1);
  
  console.log('Fetching live-scores...');
  const res2 = await axios.get(url2, { headers });
  console.log('291-7 in live-scores:', res2.data.includes('291-7'));
  console.log('Jacob Bethell in live-scores:', res2.data.split('Jacob Bethell').length - 1);
  
  fs.writeFileSync('cb_live_scores.html', res2.data);
} catch (e) {
  console.error(e.message);
}
