import axios from 'axios';

const url = 'https://www.cricbuzz.com/live-cricket-full-commentary/129563/eng-vs-nz-2nd-test-new-zealand-tour-of-england-2026';
const headers = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,*/*',
  'Referer': 'https://www.cricbuzz.com/'
};

const res = await axios.get(url, { headers, timeout: 15000 });
const html = res.data;

// Find all script blocks that contain "27:"
const scriptBlocks = [];
const regex = /self\.__next_f\.push\(([^)]+)\)/g;
let m;
let count = 0;
while ((m = regex.exec(html)) !== null && count < 40) {
  const content = m[1];
  if (content.includes('"27:')) {
    console.log('Found block with 27: at index', m.index);
    console.log('Content (200):', content.substring(0, 200));
    console.log('---');
  }
  count++;
}

// Also look for 27:" pattern directly in html
const directIdx = html.indexOf('"27:"');
console.log('\nDirect "27:" at:', directIdx);
if (directIdx > -1) {
  console.log('Context:', html.substring(directIdx - 20, directIdx + 200));
}

// Try with different quotes
const directIdx2 = html.indexOf('27:\\"');
console.log('\n27:\\"  at:', directIdx2);
if (directIdx2 > -1) {
  console.log('Context:', html.substring(directIdx2 - 10, directIdx2 + 200));
}

// Search raw for Tom Latham in script contexts
const lathamIdx = html.indexOf('Tom Latham:');
console.log('\nTom Latham: at:', lathamIdx);
if (lathamIdx > -1) {
  console.log('Context before:', html.substring(lathamIdx - 100, lathamIdx + 200));
}
