import fs from 'fs';

const html = fs.readFileSync('cb_live_scores.html', 'utf8');
const regex = /self\.__next_f\.push\(\[1,"([\s\S]+?)"\]\)/g;
let match;
while ((match = regex.exec(html)) !== null) {
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
}
