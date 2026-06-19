const fs = require('fs');
const txt = fs.readFileSync('full_comm_payload.txt', 'utf8');
const regex = /"href":"([^"]+)"/g;
let m;
const hrefs = [];
while ((m = regex.exec(txt)) !== null) {
    hrefs.push(m[1]);
}
console.log([...new Set(hrefs)].filter(h => h.includes('129563')));
