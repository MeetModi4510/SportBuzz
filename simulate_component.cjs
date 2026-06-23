const fs = require('fs');
const raw = JSON.parse(fs.readFileSync('public/data/fotmob_cache/player_30981.json', 'utf8'));

function findShotmap(obj, depth = 0) {
  if (depth > 10) return null;
  if (Array.isArray(obj) && obj.length > 0 && obj[0] && obj[0].eventType) return obj;
  if (typeof obj === 'object' && obj !== null) {
    for (const key of Object.keys(obj)) {
      const result = findShotmap(obj[key], depth + 1);
      if (result) return result;
    }
  }
  return null;
}

const realShots = findShotmap(raw);

// Simulate exactly what the component does in rawShots useMemo
const processedShots = realShots.map(s => {
  const rawX = s.x;
  const rawY = s.y;
  const top = ((rawX - 52.5) / 52.5) * 100;
  const left = (rawY / 68) * 100;
  return {
    left,
    top,
    isGoal: s.eventType === 'Goal',
    eventType: s.eventType,
    isOnTarget: (s.eventType === 'AttemptSaved' && !s.isBlocked) || s.eventType === 'Goal',
    isBlocked: s.isBlocked,  // CHECK: is this available?
  };
});

// Simulate what the render does
let filled = 0, hollow = 0, goals = 0, skipped = 0;
processedShots.forEach(shot => {
  if (shot.top < 0 || shot.top > 100) { skipped++; return; }
  if (shot.isGoal) { goals++; return; }
  // THE RENDER LINE: const isOnTarget = shot.isOnTarget && !shot.isGoal
  const isOnTarget = shot.isOnTarget && !shot.isGoal;
  if (isOnTarget) filled++;
  else hollow++;
});

console.log('=== Component Simulation ===');
console.log('Skipped (out of bounds):', skipped);
console.log('Goals (ball emoji):', goals);
console.log('Filled (on target, not goal):', filled);
console.log('Hollow (not on target):', hollow);
console.log('Total visible:', goals + filled + hollow);
console.log('On target %:', ((goals + filled) / (goals + filled + hollow) * 100).toFixed(0) + '%');
console.log('');
console.log('=== Sample of EACH type ===');
const saved_not_blocked = processedShots.filter(s => s.eventType === 'AttemptSaved' && !s.isBlocked);
const saved_blocked = processedShots.filter(s => s.eventType === 'AttemptSaved' && s.isBlocked);
console.log('AttemptSaved not blocked (FILLED):', saved_not_blocked.length);
console.log('AttemptSaved blocked (HOLLOW):', saved_blocked.length);
console.log('Miss (HOLLOW):', processedShots.filter(s => s.eventType === 'Miss').length);
console.log('Post (HOLLOW):', processedShots.filter(s => s.eventType === 'Post').length);
console.log('Goal (EMOJI):', processedShots.filter(s => s.isGoal).length);
