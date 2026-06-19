const fs = require('fs');
const txt = fs.readFileSync('full_comm_html.txt', 'utf8');
const links = [];
const regex = /href="([^"]+)"/g;
let match;
while ((match = regex.exec(txt)) !== null) {
    if (match[1].toLowerCase().includes('innings')) {
        links.push(match[1]);
    }
}
console.log('Innings links:', [...new Set(links)]);
