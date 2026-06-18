import axios from 'axios';
import fs from 'fs';

const url = 'https://www.cricbuzz.com/live-cricket-full-commentary/156157/inda-vs-afga-5th-match-tri-nation-a-series-in-sri-lanka-2026';
const headers = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Accept': 'text/html,*/*',
  'Referer': 'https://www.cricbuzz.com/'
};

try {
  const res = await axios.get(url, { headers, timeout: 15000 });
  const html = res.data;
  const regex = /self\.__next_f\.push\(\[1,"([\s\S]+?)"\]\)/g;
  let match;
  while ((match = regex.exec(html)) !== null) {
    try {
      let unescaped;
      try { unescaped = JSON.parse('"' + match[1] + '"'); }
      catch (_) { unescaped = match[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\'); }
      
      if (unescaped.includes('commentaryList')) {
        const keyMatches = [...unescaped.matchAll(/"([a-zA-Z0-9_]+)":/g)].map(m => m[1]);
        const uniqueKeys = [...new Set(keyMatches)];
        console.log('Unique keys:', uniqueKeys.slice(0, 50).join(', '));
        const idx = unescaped.indexOf('commentaryList');
        console.log('Context:', unescaped.substring(idx - 100, idx + 300));
      }
    } catch (e) {}
  }
} catch (e) {
  console.error(e.message);
}
