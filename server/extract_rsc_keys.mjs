const fs = require('fs');

const html = fs.readFileSync('cb_full_comm_correct.html', 'utf8');

const regex = /self\.__next_f\.push\(\[1,"([\s\S]+?)"\]\)/g;
let match;
while ((match = regex.exec(html)) !== null) {
  try {
    let unescaped;
    try {
      unescaped = JSON.parse('"' + match[1] + '"');
    } catch (_) {
      unescaped = match[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\');
    }
    
    // Look for keywords
    if (unescaped.includes('commentaryList') || unescaped.includes('over_num')) {
      console.log('Found chunk containing commentary keywords!');
      fs.writeFileSync('rsc_chunk.txt', unescaped);
      
      const keyMatches = [...unescaped.matchAll(/"([a-zA-Z0-9_]+)":/g)].map(m => m[1]);
      const uniqueKeys = [...new Set(keyMatches)];
      console.log('Unique keys:', uniqueKeys.slice(0, 50).join(', '));
      
      // Let's specifically look for the structure around commentaryList
      const idx = unescaped.indexOf('commentaryList');
      if (idx > -1) {
        console.log('Context of commentaryList:', unescaped.substring(idx - 50, idx + 200));
      }
    }
  } catch (e) {
  }
}
