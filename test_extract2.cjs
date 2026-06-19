const fs = require('fs');
const str = fs.readFileSync('raw_121873.txt', 'utf8');
const unescaped = str.replace(/\\"/g, '"');

let start = 0;
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
            if (obj && typeof obj === 'object') {
                if ('miniscore' in obj) {
                    console.log('Found miniscore at top level! Keys:', Object.keys(obj));
                    break;
                } else if (obj.matchDetails && 'miniscore' in obj.matchDetails) {
                    console.log('Found miniscore inside matchDetails! Keys:', Object.keys(obj));
                    break;
                } else if (obj.pageData && obj.pageData.miniscore) {
                    console.log('Found miniscore inside pageData! Keys:', Object.keys(obj));
                    break;
                } else {
                    // deep search
                    const search = (o) => {
                        if (!o || typeof o !== 'object') return false;
                        if ('miniscore' in o) return true;
                        for (let k in o) {
                            if (search(o[k])) return true;
                        }
                        return false;
                    };
                    if (search(obj)) {
                        console.log('Found miniscore deeply nested! Top level keys:', Object.keys(obj));
                    }
                }
            }
        } catch(e) {}
    }
    start++;
}
