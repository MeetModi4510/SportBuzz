const fs = require('fs');

// Check the most recently updated player files (737066=Haaland, 661519=Undav)
const files = ['player_737066.json', 'player_661519.json'];

function findShotmap(obj, depth = 0) {
  if (depth > 10) return null;
  if (Array.isArray(obj) && obj.length > 0 && obj[0] && (obj[0].eventType || obj[0].result || obj[0].isOnTarget !== undefined)) return obj;
  if (typeof obj === 'object' && obj !== null) {
    for (const key of Object.keys(obj)) {
      const result = findShotmap(obj[key], depth + 1);
      if (result) return result;
    }
  }
  return null;
}

for (const file of files) {
  try {
    const raw = JSON.parse(fs.readFileSync(`public/data/fotmob_cache/${file}`, 'utf8'));
    const shots = findShotmap(raw);
    if (!shots) { console.log(`${file}: No shotmap found`); continue; }

    console.log(`\n=== ${file} (${shots.length} shots) ===`);
    
    // Show ALL unique field names in shot objects
    const allKeys = new Set();
    shots.forEach(s => Object.keys(s).forEach(k => allKeys.add(k)));
    console.log('Shot object fields:', [...allKeys].join(', '));
    
    // Show first 5 shots with ALL fields
    console.log('\nFirst 5 shots (all fields):');
    shots.slice(0, 5).forEach((s, i) => {
      console.log(`Shot ${i+1}:`, JSON.stringify(s));
    });
    
    // Count by eventType and isOnTarget
    const byType = {};
    shots.forEach(s => { byType[s.eventType] = (byType[s.eventType] || 0) + 1; });
    console.log('\nBy eventType:', byType);
    
    const onTargetTrue = shots.filter(s => s.isOnTarget === true).length;
    const onTargetFalse = shots.filter(s => s.isOnTarget === false).length;
    const onTargetUndef = shots.filter(s => s.isOnTarget === undefined || s.isOnTarget === null).length;
    console.log(`isOnTarget: true=${onTargetTrue}, false=${onTargetFalse}, undefined/null=${onTargetUndef}`);
    
  } catch(e) { console.log(`Error reading ${file}:`, e.message); }
}
