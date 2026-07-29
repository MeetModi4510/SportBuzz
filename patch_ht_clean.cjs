const fs = require('fs');
const lines = fs.readFileSync('server/services/htCommentaryService.js', 'utf8').split('\n');

// The good new function ends at line 123 (index 122 = '}')
// The mapHTCommentToStandard function starts at line 304 (index 303)
// Find mapHTCommentToStandard
const mapFnLine = lines.findIndex(l => l.includes('function mapHTCommentToStandard'));
console.log('mapHTCommentToStandard starts at line:', mapFnLine + 1);

// The good code ends at line 123 (the closing brace of findHTMatchId)
const goodEndLine = 123; // 1-indexed

// Combine: lines 0..122 + blank + lines from mapFnLine onward
const cleaned = [
    ...lines.slice(0, goodEndLine),
    '',
    ...lines.slice(mapFnLine)
];

fs.writeFileSync('server/services/htCommentaryService.js', cleaned.join('\n'));
console.log('Done! New total lines:', cleaned.length);
