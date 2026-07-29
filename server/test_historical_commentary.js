import fs from 'fs';
const html = fs.readFileSync('historical_comm.html', 'utf8');

const unescaped = html.replace(/\\"/g, '"');
let start = 0;
while ((start = unescaped.indexOf('{"', start)) !== -1) {
    let end = start + 1;
    let braces = 1;
    while (end < unescaped.length && braces > 0) {
        if (unescaped[end] === '{') braces++;
        else if (unescaped[end] === '}') braces--;
        end++;
    }
    if (braces === 0) {
        try {
            const objStr = unescaped.substring(start, end);
            if (objStr.includes('"matchId":89704') || objStr.includes('"commLines"')) {
                const obj = JSON.parse(objStr);
                const keys = Object.keys(obj).slice(0, 10);
                console.log(`Found JSON object with keys: ${keys.join(', ')}. String length: ${objStr.length}`);
                if (obj.commentaryList || obj.commLines || obj.commentary) {
                    console.log(` - Has commentary fields!`);
                }
            }
        } catch(e) {}
    }
    start++;
}
