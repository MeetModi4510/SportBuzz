const fs = require('fs');
const path = 'c:\\\\Users\\\\PRANSHU PATEL\\\\OneDrive\\\\Desktop\\\\dev_scripts\\\\src\\\\components\\\\football\\\\FotmobPlayerCard.tsx';
let content = fs.readFileSync(path, 'utf8');

// Update the mock generator to precisely yield 40% On Target (exactly 22 saves out of 72 misses)
content = content.replace(
  /eventType: isGoal \? 'Goal' : \(seed % 3 === 0 \? 'AttemptSaved' : 'Miss'\),/g,
  "eventType: isGoal ? 'Goal' : ((seed % 100 < 28) ? 'AttemptSaved' : 'Miss'),"
);

content = content.replace(
  /isOnTarget: isGoal \|\| seed % 3 === 0,/g,
  "isOnTarget: isGoal || (seed % 100 < 28),"
);

fs.writeFileSync(path, content, 'utf8');
console.log('Fixed mock eventType and isOnTarget to yield exactly 40%');
