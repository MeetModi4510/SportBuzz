const fs = require('fs');
const path = 'c:\\\\Users\\\\PRANSHU PATEL\\\\OneDrive\\\\Desktop\\\\dev_scripts\\\\src\\\\components\\\\football\\\\FotmobPlayerCard.tsx';
let content = fs.readFileSync(path, 'utf8');

// Update the mock generator to use seed % 3 === 0 for AttemptSaved to match the 40% On Target statistic of the original image
content = content.replace(
  /eventType: isGoal \? 'Goal' : \(seed % 2 === 0 \? 'AttemptSaved' : 'Miss'\),/g,
  "eventType: isGoal ? 'Goal' : (seed % 3 === 0 ? 'AttemptSaved' : 'Miss'),"
);

fs.writeFileSync(path, content, 'utf8');
console.log('Fixed mock eventType logic successfully');
