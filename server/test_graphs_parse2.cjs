const fs = require('fs');
const txt = fs.readFileSync('graphs_payload.txt', 'utf8');

const regex = /.{0,40}Ball Map.{0,40}/gi;
let match;
while ((match = regex.exec(txt)) !== null) {
    console.log('Ball Map Match:', match[0]);
}

const regex2 = /.{0,40}Win Probability.{0,40}/gi;
while ((match = regex2.exec(txt)) !== null) {
    console.log('Win Prob Match:', match[0]);
}

const regex3 = /"overs":\[/gi;
while ((match = regex3.exec(txt)) !== null) {
    console.log('Overs Match:', txt.substring(match.index - 20, match.index + 200));
}
