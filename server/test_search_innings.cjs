const fs = require('fs');
const txt = fs.readFileSync('full_comm_payload.txt', 'utf8');

const regex = /.{0,40}innings.{0,40}/gi;
let match;
let count = 0;
while ((match = regex.exec(txt)) !== null && count < 20) {
    console.log(match[0]);
    count++;
}
