const fs = require('fs');
const path = 'c:\\Users\\PRANSHU PATEL\\OneDrive\\Desktop\\dev_scripts\\src\\components\\football\\FotmobPlayerCard.tsx';
let content = fs.readFileSync(path, 'utf8');

let changes = 0;

// FIX 1: In realShotmap.map() - isOnTarget stored on each shot
// Old: isOnTarget: s.eventType === 'AttemptSaved' || s.eventType === 'Goal',
// New: exclude blocked shots from "on target"
const old1 = "isOnTarget: s.eventType === 'AttemptSaved' || s.eventType === 'Goal',";
const new1 = "isOnTarget: (s.eventType === 'AttemptSaved' && !s.isBlocked) || s.eventType === 'Goal',";
if (content.includes(old1)) {
  content = content.replace(old1, new1);
  changes++;
  console.log('FIX 1 applied: realShotmap isOnTarget now excludes blocked shots');
} else {
  console.log('FIX 1 NOT FOUND - already fixed or pattern changed');
}

// FIX 2: In the pitch render loop - const isOnTarget = shot.eventType === 'AttemptSaved';
// Old: const isOnTarget = shot.eventType === 'AttemptSaved';
// New: exclude blocked shots
const old2 = "const isOnTarget = shot.eventType === 'AttemptSaved';";
const new2 = "const isOnTarget = shot.eventType === 'AttemptSaved' && !shot.isBlocked;";
if (content.includes(old2)) {
  content = content.replace(old2, new2);
  changes++;
  console.log('FIX 2 applied: pitch render isOnTarget now excludes blocked shots');
} else {
  console.log('FIX 2 NOT FOUND - already fixed or pattern changed');
}

// FIX 3: In mock generator - isOnTarget for generated shots
// Old: isOnTarget: isGoal || (seed % 100 < 28),
// Keep consistent: for mock data, AttemptSaved is also not blocked, so isOnTarget matches eventType
const old3 = "isOnTarget: isGoal || (seed % 100 < 28),";
const new3 = "isOnTarget: isGoal || (seed % 100 < 28), // AttemptSaved mock shots: not blocked, so on target";
if (content.includes(old3)) {
  content = content.replace(old3, new3);
  changes++;
  console.log('FIX 3 applied: mock generator isOnTarget comment updated');
} else {
  // Try old version
  const old3b = "isOnTarget: isGoal || seed % 3 === 0,";
  const new3b = "isOnTarget: isGoal || seed % 3 === 0, // AttemptSaved mock shots are not blocked";
  if (content.includes(old3b)) {
    content = content.replace(old3b, new3b);
    changes++;
    console.log('FIX 3b applied');
  } else {
    console.log('FIX 3 NOT FOUND');
  }
}

// FIX 4: On-target percentage display
// Old: filteredShots.filter((s: any) => s.isOnTarget || s.isGoal)
// Should be using isOnTarget directly since isGoal is already included in isOnTarget
const old4 = "filteredShots.filter((s: any) => s.isOnTarget || s.isGoal).length";
const new4 = "filteredShots.filter((s: any) => s.isOnTarget).length";
if (content.includes(old4)) {
  content = content.replace(old4, new4);
  changes++;
  console.log('FIX 4 applied: on target % display now only uses isOnTarget (which includes Goals)');
} else {
  console.log('FIX 4 NOT FOUND');
}

fs.writeFileSync(path, content, 'utf8');
console.log(`\nTotal changes applied: ${changes}`);
