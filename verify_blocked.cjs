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

const shots = findShotmap(raw);
const total = shots.length;

// Current (wrong) logic
const currentOnTarget = shots.filter(s => s.eventType === 'AttemptSaved' || s.eventType === 'Goal').length;

// Correct logic: blocked shots are NOT on target
const correctOnTarget = shots.filter(s => (s.eventType === 'AttemptSaved' && !s.isBlocked) || s.eventType === 'Goal').length;

// Breakdown
const goals = shots.filter(s => s.eventType === 'Goal').length;
const savedNotBlocked = shots.filter(s => s.eventType === 'AttemptSaved' && !s.isBlocked).length;
const savedBlocked = shots.filter(s => s.eventType === 'AttemptSaved' && s.isBlocked).length;
const miss = shots.filter(s => s.eventType === 'Miss').length;
const post = shots.filter(s => s.eventType === 'Post').length;

console.log('=== Messi Shot Breakdown ===');
console.log('Total shots:', total);
console.log('Goals:', goals, '(ball emoji - always on target)');
console.log('AttemptSaved (NOT blocked = truly saved):', savedNotBlocked, '-> FILLED circle');
console.log('AttemptSaved (isBlocked=true = blocked shot):', savedBlocked, '-> HOLLOW circle');
console.log('Miss:', miss, '-> HOLLOW circle');
console.log('Post:', post, '-> HOLLOW circle');
console.log('');
console.log('CURRENT (wrong):', currentOnTarget, '/', total, '=', (currentOnTarget/total*100).toFixed(0) + '%');
console.log('CORRECT (right):', correctOnTarget, '/', total, '=', (correctOnTarget/total*100).toFixed(0) + '%');
console.log('Reference image shows: 40%');
