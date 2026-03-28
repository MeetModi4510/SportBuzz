const fs = require('fs');
const content = fs.readFileSync('d:/GATE MEET/SportBuzz/SportBuzz/src/pages/football/FootballTeamProfile.tsx', 'utf8');

function checkTags(content) {
    const tags = [];
    const re = /<(\/?[a-zA-Z0-9]+)/g;
    let match;
    while ((match = re.exec(content)) !== null) {
        const tag = match[1];
        if (tag.startsWith('/')) {
            const closing = tag.slice(1);
            if (tags.length === 0) {
                console.log(`Extra closing tag: ${tag}`);
            } else {
                const last = tags.pop();
                if (last !== closing) {
                    console.log(`Mismatched tags: opened ${last}, closed ${closing}`);
                }
            }
        } else {
            // Check if self-closing
            const start = match.index;
            const end = content.indexOf('>', start);
            if (content[end - 1] !== '/') {
                tags.push(tag);
            }
        }
    }
    if (tags.length > 0) {
        console.log(`Unclosed tags: ${tags.join(', ')}`);
    } else {
        console.log('All tags balanced!');
    }
}

checkTags(content);
