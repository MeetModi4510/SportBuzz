import fs from 'fs';

const payloadStr = fs.readFileSync('rsc_payload.json', 'utf8');
let start = 0;
while ((start = payloadStr.indexOf('{"', start)) !== -1) {
    let end = start + 1;
    let braces = 1;
    while (end < payloadStr.length && braces > 0) {
        if (payloadStr[end] === '{') braces++;
        else if (payloadStr[end] === '}') braces--;
        end++;
    }
    if (braces === 0) {
        try {
            const obj = JSON.parse(payloadStr.substring(start, end));
            if (obj.matchId === 129480) {
                if (obj.matchFormat) {
                    console.log('Match Status:', obj.status, 'State:', obj.state, 'Match Description:', obj.matchDescription);
                }
            }
        } catch(e) {}
    }
    start++;
}



