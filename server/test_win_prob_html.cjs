const fs = require('fs');
const txt = fs.readFileSync('graphs_payload.txt', 'utf8');

const regex = /.{0,50}Draw\/Tie.{0,50}/gi;
let match;
while ((match = regex.exec(txt)) !== null) {
    console.log('Draw/Tie Match:', match[0]);
}

const regex2 = /.{0,50}Win Probability.{0,50}/gi;
while ((match = regex2.exec(txt)) !== null) {
    console.log('Win Prob Match:', match[0]);
}
