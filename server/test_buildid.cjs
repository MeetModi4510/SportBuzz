const fs = require('fs');
const txt = fs.readFileSync('full_comm_html.txt', 'utf8');

const match = txt.match(/"buildId":"([^"]+)"/);
if (match) {
    console.log("Build ID:", match[1]);
} else {
    console.log("Build ID not found.");
}
