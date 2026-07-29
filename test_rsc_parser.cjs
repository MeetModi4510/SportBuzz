const fs = require('fs');
const data = fs.readFileSync('test_rsc.txt', 'utf8');
console.log('Size:', data.length);
console.log('Has scoreCard:', data.includes('scoreCard'));
console.log('Has scorecard:', data.includes('scorecard'));
console.log('Has score:', data.includes('score'));
console.log('Has matchDetails:', data.includes('matchDetails'));
