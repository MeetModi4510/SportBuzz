const fs = require('fs');
const path = 'c:\\\\Users\\\\PRANSHU PATEL\\\\OneDrive\\\\Desktop\\\\dev_scripts\\\\src\\\\components\\\\football\\\\FotmobPlayerCard.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Fix the realShotmap parser
content = content.replace(
  /isOnTarget: s\.isOnTarget,/g,
  "isOnTarget: s.eventType === 'AttemptSaved' || s.eventType === 'Goal',"
);

// 2. Fix the mock generator (just in case)
content = content.replace(
  /isOnTarget: isGoal \|\| seed % 2 === 0,/g,
  "isOnTarget: isGoal || seed % 3 === 0,"
);

// 3. Fix the render logic in VIEW 1
content = content.replace(
  /const isOnTarget = shot\.eventType === 'AttemptSaved' \|\| shot\.isOnTarget;/g,
  "const isOnTarget = shot.eventType === 'AttemptSaved';"
);

// 4. Fix the mini net result text display
content = content.replace(
  /activeShot\.isGoal \? 'Goal' : \(activeShot\.isOnTarget \? 'Saved' : 'Miss'\)/g,
  "activeShot.isGoal ? 'Goal' : (activeShot.eventType === 'AttemptSaved' ? 'Saved' : 'Miss')"
);

fs.writeFileSync(path, content, 'utf8');
console.log('Fixed on-target logic successfully');
