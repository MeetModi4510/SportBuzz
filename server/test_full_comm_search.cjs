const fs = require('fs');
const txt = fs.readFileSync('full_comm_payload.txt', 'utf8');
const match = txt.match(/NZ 1st Innings/gi);
console.log('NZ 1st Innings found:', match ? match.length : 0);

// Let's search for "href" links that have "full-commentary"
const hrefs = [];
const hrefRegex = /"href":"([^"]+)"/g;
let m;
while ((m = hrefRegex.exec(txt)) !== null) {
    if (m[1].includes('full-commentary')) {
        hrefs.push(m[1]);
    }
}
console.log('Full Commentary HREFs:', [...new Set(hrefs)]);
