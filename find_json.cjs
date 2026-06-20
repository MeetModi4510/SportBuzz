const fs = require('fs');
const html = fs.readFileSync('cricbuzz_graphs.html', 'utf8');
const match = html.match(/.{0,50}50.*?51.*?53.{0,50}/s);
if (match) console.log(match[0]);
