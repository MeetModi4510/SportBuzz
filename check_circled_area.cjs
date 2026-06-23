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

// Simulate component coordinate mapping
const processedShots = realShots.map(s => {
  const rawX = s.x;
  const rawY = s.y;
  const top = ((rawX - 52.5) / 52.5) * 100;
  const left = (rawY / 68) * 100;
  return {
    left: Math.round(left),
    top: Math.round(top),
    eventType: s.eventType,
    isBlocked: s.isBlocked,
    isOnTarget: s.isOnTarget,
    x: rawX, y: rawY
  };
});

// Find shots in the upper-left cluster that is circled in red
// Red circles are approx: left 20-42%, top 35-55%
console.log('=== Shots in CIRCLED UPPER-LEFT AREA (left:20-42%, top:35-55%) ===');
const circledShots = processedShots.filter(s => 
  s.left >= 15 && s.left <= 45 && 
  s.top >= 30 && s.top <= 58
);

circledShots.forEach(s => {
  console.log(`left=${s.left}% top=${s.top}% | eventType=${s.eventType} | isBlocked=${s.isBlocked} | isOnTarget=${s.isOnTarget}`);
});

console.log('\nTotal shots in that area:', circledShots.length);
console.log('AttemptSaved:', circledShots.filter(s => s.eventType === 'AttemptSaved').length);
console.log('Miss:', circledShots.filter(s => s.eventType === 'Miss').length);
console.log('Post:', circledShots.filter(s => s.eventType === 'Post').length);
console.log('Goal:', circledShots.filter(s => s.eventType === 'Goal').length);
