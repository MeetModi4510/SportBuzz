
const fs = require('fs');
const filepath = 'TM.tsx';
const content = fs.readFileSync(filepath, 'utf8');

let stack = [];
let lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    for (let j = 0; j < line.length; j++) {
        let char = line[j];
        if (char === '(' || char === '{' || char === '[') {
            stack.push({char, line: i+1, col: j+1});
        } else if (char === ')' || char === '}' || char === ']') {
            if (stack.length === 0) {
                console.log('Extra closer: ' + char + ' at L' + (i+1) + ':C' + (j+1));
                continue;
            }
            let last = stack.pop();
            if ((char === ')' && last.char !== '(') ||
                (char === '}' && last.char !== '{') ||
                (char === ']' && last.char !== '[')) {
                console.log('Mismatched: ' + last.char + ' (L' + last.line + ') with ' + char + ' (L' + (i+1) + ':C' + (j+1) + ')');
            }
        }
    }
}

console.log('Total lines: ' + lines.length);
console.log('Remaining open: ' + stack.length);
stack.forEach(s => console.log(s.char + ' at L' + s.line + ':C' + s.col));
