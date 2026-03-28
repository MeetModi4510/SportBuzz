
const fs = require('fs');
const filepath = 'd:/GATE MEET/SportBuzz/SportBuzz/src/components/admin/TournamentManager.tsx';
const content = fs.readFileSync(filepath, 'utf8');
const lines = content.split('\n');

const startLine = 1217;
const endLine = 2260;
const block = lines.slice(startLine - 1, endLine).join('\n');

let parens = 0;
let braces = 0;
let angleBrackets = 0;

for (let i = 0; i < block.length; i++) {
    const char = block[i];
    if (char === '(') parens++;
    else if (char === ')') parens--;
    else if (char === '{') braces++;
    else if (char === '}') braces--;
    else if (char === '<' && block[i+1] !== ' ' && block[i+1] !== '=') angleBrackets++;
    else if (char === '>' && block[i-1] !== ' ' && block[i-1] !== '-') angleBrackets--;
}

console.log('Analysis for lines ' + startLine + '-' + endLine + ':');
console.log('Parentheses balance:', parens);
console.log('Braces balance:', braces);
console.log('Angle brackets balance (rough):', angleBrackets);
