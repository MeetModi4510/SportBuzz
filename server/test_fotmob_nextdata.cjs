const fs = require('fs');
const html = fs.readFileSync('fotmob_transfers.html', 'utf8');
const regex = /https:\/\/www\.fotmob\.com\/api\/[^"'\`]+/g;
const matches = html.match(regex) || [];
console.log('Unique API URLs found in HTML:', [...new Set(matches)]);

const pathsRegex = /"\/api\/[^"]+"/g;
const pathsMatches = html.match(pathsRegex) || [];
console.log('Unique API paths found in HTML:', [...new Set(pathsMatches)]);
