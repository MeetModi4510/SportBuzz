const fs = require('fs');
const path = require('path');

const files = fs.readdirSync('public/data/fotmob_cache').filter(f => f.startsWith('player_'));

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

for (const file of files) {
  try {
    const raw = JSON.parse(fs.readFileSync(`public/data/fotmob_cache/${file}`, 'utf8'));
    const shots = findShotmap(raw);
    if (!shots || shots.length < 3) continue;

    const total = shots.length;
    const byEventType = {};
    shots.forEach(s => { byEventType[s.eventType] = (byEventType[s.eventType] || 0) + 1; });

    // Check if blocked AttemptSaved shots have isOnTarget=true or false
    const savedBlocked_ontarget_true = shots.filter(s => s.eventType === 'AttemptSaved' && s.isBlocked && s.isOnTarget === true).length;
    const savedBlocked_ontarget_false = shots.filter(s => s.eventType === 'AttemptSaved' && s.isBlocked && s.isOnTarget === false).length;
    const savedNotBlocked = shots.filter(s => s.eventType === 'AttemptSaved' && !s.isBlocked).length;

    // Two possible visual rules:
    const ruleA = shots.filter(s => s.eventType === 'AttemptSaved').length; // all AttemptSaved filled
    const ruleB = shots.filter(s => s.isOnTarget === true && s.eventType !== 'Goal').length; // raw isOnTarget filled

    console.log(`\n=== ${file} (${total} shots) ===`);
    console.log('By eventType:', byEventType);
    console.log(`AttemptSaved blocked (isOnTarget=true): ${savedBlocked_ontarget_true}`);
    console.log(`AttemptSaved blocked (isOnTarget=false): ${savedBlocked_ontarget_false}`);
    console.log(`AttemptSaved not blocked: ${savedNotBlocked}`);
    console.log(`Rule A (all AttemptSaved = filled): ${ruleA} filled circles`);
    console.log(`Rule B (raw isOnTarget=true = filled): ${ruleB} filled circles`);
    console.log(`Diff: ${ruleA - ruleB} circles different`);
  } catch(e) { /* skip */ }
}
