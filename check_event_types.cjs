const fs = require('fs');

// Check all cached player files for shotmap data
const files = [
  'public/data/fotmob_cache/player_1216079.json',
  'public/data/fotmob_cache/player_292462.json',
  'public/data/fotmob_cache/player_30981.json',
  'public/data/fotmob_cache/player_661519.json',
  'public/data/fotmob_cache/player_737066.json',
];

for (const f of files) {
  try {
    const raw = JSON.parse(fs.readFileSync(f, 'utf8'));
    // Try to find shotmap anywhere in the object
    const str = JSON.stringify(raw);
    const idx = str.indexOf('"eventType"');
    if (idx >= 0) {
      console.log('\n=== FILE:', f, '===');
      // Find all unique eventType values
      const matches = [...str.matchAll(/"eventType":"([^"]+)"/g)];
      const types = [...new Set(matches.map(m => m[1]))];
      console.log('Unique eventTypes:', types);
      console.log('Total shots with eventType:', matches.length);
      // Also show a sample shot
      const shotIdx = str.indexOf('"eventType"');
      console.log('Sample context:', str.substring(Math.max(0, shotIdx-100), shotIdx+200));
    }
  } catch (e) {
    console.log('Error reading', f, e.message);
  }
}
