const fs = require('fs');
const str = fs.readFileSync('raw_121873.txt', 'utf8');

// Unescape NextJS stringified JSON
const unescaped = str.replace(/\\"/g, '"');

let start = 0;
let foundMiniscore = null;
let foundWinProb = null;
let foundKeyStats = null;

while ((start = unescaped.indexOf('{"miniscore":', start)) !== -1) {
    let end = start + 1;
    let braces = 1;
    while (end < unescaped.length && braces > 0) {
        if (unescaped[end] === '{') braces++;
        else if (unescaped[end] === '}') braces--;
        end++;
    }
    if (braces === 0) {
        try {
            foundMiniscore = JSON.parse(unescaped.substring(start, end));
            break;
        } catch(e) {}
    }
    start++;
}

// Check if win probability is stored separately
start = 0;
while ((start = unescaped.indexOf('{"winProbability":', start)) !== -1) {
    let end = start + 1;
    let braces = 1;
    while (end < unescaped.length && braces > 0) {
        if (unescaped[end] === '{') braces++;
        else if (unescaped[end] === '}') braces--;
        end++;
    }
    if (braces === 0) {
        try {
            foundWinProb = JSON.parse(unescaped.substring(start, end));
            break;
        } catch(e) {}
    }
    start++;
}


if (foundMiniscore) {
    console.log('Miniscore Keys:', Object.keys(foundMiniscore.miniscore));
    console.log('Batters:', foundMiniscore.miniscore.batsmanStriker?.name, foundMiniscore.miniscore.batsmanNonStriker?.name);
    console.log('Bowler:', foundMiniscore.miniscore.bowlerStriker?.name);
    console.log('KeyStats:', foundMiniscore.miniscore.keyStats);
} else {
    console.log('miniscore not parsed properly');
}

if (foundWinProb) {
    console.log('WinProb:', foundWinProb);
} else {
    // maybe winProbability is inside miniscore?
    if (foundMiniscore?.miniscore?.winProbability) {
        console.log('WinProb inside miniscore:', foundMiniscore.miniscore.winProbability);
    } else {
        console.log('WinProb not found');
    }
}
