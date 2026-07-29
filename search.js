const fs = require('fs');
const lines = fs.readFileSync('src/pages/MatchDetails.tsx', 'utf8').split('\n');
lines.forEach((l, i) => {
    if (l.includes("activeTab === 'commentary'")) {
        console.log(`Tab check at ${i+1}: ${l.trim()}`);
    }
    if (l.includes("cbFullCommentaryField")) {
        console.log(`cbFullCommentaryField at ${i+1}: ${l.trim()}`);
    }
});
