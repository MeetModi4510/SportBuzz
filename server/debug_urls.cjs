const fs = require('fs');
const text = fs.readFileSync('all_payloads.txt', 'utf8');
const regex = /https?:\/\/[^\"]+/g;
let match;
const urls = new Set();
while ((match = regex.exec(text)) !== null) {
    if (match[0].includes('cricbuzz') || match[0].includes('api')) {
        urls.add(match[0]);
    }
}
console.log(Array.from(urls).join('\n'));
