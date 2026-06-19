const fs = require('fs');
const txt = fs.readFileSync('full_comm_payload.txt', 'utf8');

const regex = /"nextPage"|"cursor"|"lastId"|"timestamp"|"pagination"|"page"/gi;
let match;
const results = new Set();
while ((match = regex.exec(txt)) !== null) {
    const start = Math.max(0, match.index - 50);
    const end = Math.min(txt.length, match.index + 50);
    results.add(txt.substring(start, end));
}
console.log(Array.from(results).slice(0, 20));
