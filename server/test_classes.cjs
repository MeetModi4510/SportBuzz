const fs = require('fs');
const txt = fs.readFileSync('full_comm_html.txt', 'utf8');

const regex = /class="([^"]+)"/g;
let match;
const classes = new Set();
while ((match = regex.exec(txt)) !== null) {
    classes.add(match[1]);
}
console.log(Array.from(classes).slice(0, 30));
