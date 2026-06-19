const fs = require('fs');
const str = fs.readFileSync('raw_121873.txt', 'utf8');
const unescaped = str.replace(/\\"/g, '"');

let start = 0;
let foundData = {};

function deepMerge(target, source) {
    for (const key of Object.keys(source)) {
        if (source[key] instanceof Object && key in target) {
            Object.assign(source[key], deepMerge(target[key], source[key]));
        }
    }
    Object.assign(target || {}, source);
    return target;
}

while ((start = unescaped.indexOf('{', start)) !== -1) {
    let end = start + 1;
    let braces = 1;
    while (end < unescaped.length && braces > 0) {
        if (unescaped[end] === '{') braces++;
        else if (unescaped[end] === '}') braces--;
        end++;
    }
    if (braces === 0) {
        try {
            const obj = JSON.parse(unescaped.substring(start, end));
            if (obj.matchId === 121873 || obj.matchInfo?.matchId === 121873) {
                // Instead of shallow merge, deep merge so we don't lose nested keys like miniscore
                foundData = deepMerge(foundData, obj);
            }
        } catch(e) {}
    }
    start++;
}

console.log('Miniscore keys after deep merge:', foundData.commentaryPageData?.miniscore ? Object.keys(foundData.commentaryPageData.miniscore) : 'Not found');
console.log('Match score:', foundData.matchScore);
