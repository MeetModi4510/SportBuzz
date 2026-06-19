const fs = require('fs');
const txt = fs.readFileSync('full_comm_payload.txt', 'utf8');

function extractJsonObjects(htmlStr, key) {
    const results = [];
    const keyRegex = new RegExp(`"${key}"\\s*:\\s*`, 'g');
    
    let match;
    while ((match = keyRegex.exec(htmlStr)) !== null) {
        let startIndex = match.index + match[0].length;
        let openBraces = 0;
        let openBrackets = 0;
        let isString = false;
        let isEscaped = false;
        let endIndex = -1;

        const char = htmlStr[startIndex];
        if (char !== '{' && char !== '[') {
            continue;
        }

        for (let i = startIndex; i < htmlStr.length; i++) {
            const c = htmlStr[i];
            
            if (isEscaped) {
                isEscaped = false;
                continue;
            }
            if (c === '\\') {
                isEscaped = true;
                continue;
            }
            if (c === '"') {
                isString = !isString;
                continue;
            }

            if (!isString) {
                if (c === '{') openBraces++;
                else if (c === '}') openBraces--;
                else if (c === '[') openBrackets++;
                else if (c === ']') openBrackets--;

                if (openBraces === 0 && openBrackets === 0) {
                    endIndex = i;
                    break;
                }
            }
        }

        if (endIndex !== -1) {
            try {
                const jsonStr = htmlStr.substring(startIndex, endIndex + 1);
                const parsed = JSON.parse(jsonStr);
                results.push(parsed);
            } catch (e) {
                console.error("JSON parse error:", e.message);
            }
        }
    }
    return results;
}

const comms = extractJsonObjects(txt, 'commentaryList');
console.log('Found commentary blocks:', comms.length);

if (comms.length > 0) {
    console.log('First block length:', comms[0].length);
    console.log(comms[0][0]);
    if (comms.length > 1) {
        console.log('Second block length:', comms[1].length);
    }
}
