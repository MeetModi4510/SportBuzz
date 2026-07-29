const fs = require('fs');
const data = fs.readFileSync('test_rsc.txt', 'utf8');
const i = data.indexOf('scorecard');
if (i > -1) console.log(data.substring(i - 100, i + 500));
else console.log('Not found');
