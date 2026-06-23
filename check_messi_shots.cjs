const fs = require('fs');

// Focus on Messi (player_30981.json) - has 84 shots like the screenshot
const raw = JSON.parse(fs.readFileSync('public/data/fotmob_cache/player_30981.json', 'utf8'));

// Find shotmap deep in the object
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
if (!shots) {
  console.log('Could not find shotmap. Top-level keys:', Object.keys(raw));
  process.exit(1);
}

console.log('Total shots:', shots.length);

const byType = {};
let isOnTargetTrue = 0;
let isOnTargetFalse = 0;
let isOnTargetMissing = 0;

for (const s of shots) {
  byType[s.eventType] = (byType[s.eventType] || 0) + 1;
  if (s.isOnTarget === true) isOnTargetTrue++;
  else if (s.isOnTarget === false) isOnTargetFalse++;
  else isOnTargetMissing++;
}

console.log('\nBy eventType:', byType);
console.log('\nisOnTarget=true:', isOnTargetTrue);
console.log('isOnTarget=false:', isOnTargetFalse);
console.log('isOnTarget=missing:', isOnTargetMissing);

const onTargetLogic = shots.filter(s => s.eventType === 'AttemptSaved' || s.eventType === 'Goal').length;
const onTargetField = shots.filter(s => s.isOnTarget === true).length;
console.log('\nWith (eventType===AttemptSaved||Goal):', onTargetLogic, '=', (onTargetLogic/shots.length*100).toFixed(0) + '%');
console.log('With (isOnTarget===true):', onTargetField, '=', (onTargetField/shots.length*100).toFixed(0) + '%');

console.log('\nFirst 5 shots:');
shots.slice(0, 5).forEach(s => console.log(JSON.stringify({eventType: s.eventType, isOnTarget: s.isOnTarget, isBlocked: s.isBlocked})));
