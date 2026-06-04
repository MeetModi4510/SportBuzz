
const fs = require('fs');
const filepath = 'TM.tsx';
const content = fs.readFileSync(filepath, 'utf8');

let stack = [];
let ternaries = 0;
let lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    // Simple ternary check: count ? vs : (ignoring some common things)
    for (let j = 0; j < line.length; j++) {
        let char = line[j];
        if (char === '?' && line[j+1] !== '.' && line[j+1] !== ' ' && line[j+1] !== '?' && line[j+1] !== ':') {
             // Likely a ternary ?
             // But wait, it's hard to distinguish from types or other things.
        }
    }
}

// Actually, let's just use a better heuristic:
// Every ? ( that is NOT optional chaining should have a : ( or similar.
// But let's look for { ... ? ( ... ) : ( ... ) }

function checkTernaries(text) {
    let openTernaries = [];
    let i = 0;
    while(i < text.length) {
        if(text.slice(i, i+2) === '?.') { i += 2; continue; }
        if(text[i] === '?' && text[i+1] === '(') {
            openTernaries.push({type: 'ternary', pos: i, line: text.slice(0, i).split('\n').length});
            i += 2;
        } else if(text[i] === ':' && text[i+1] === '(' && openTernaries.length > 0) {
            let last = openTernaries[openTernaries.length-1];
            if(last.type === 'ternary') {
                last.type = 'else';
                i += 2;
            } else {
                i++;
            }
        } else if(text[i] === ')' && openTernaries.length > 0) {
             // This is tricky because ) could be for anything.
             // But if we know it's a ternary closing...
             i++;
        } else {
            i++;
        }
    }
}
// This is too hard. 
// I'll just check if there's any colon WITHOUT a preceding question mark in the vicinity.

console.log("Searching for mismatched ternaries manually...");
