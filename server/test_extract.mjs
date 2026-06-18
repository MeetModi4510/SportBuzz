import * as cheerio from 'cheerio';

function extractJsonObjects(str, keyword = null) {
    const results = [];
    let searchStr = str;
    let idx = 0;
    while (true) {
        if (keyword) {
            idx = searchStr.indexOf(`"${keyword}":[{`);
            if (idx === -1) {
                idx = searchStr.indexOf(`"${keyword}":{`);
                if (idx === -1) break;
            }
        } else {
            idx = searchStr.indexOf('{');
            if (idx === -1) break;
        }

        const startIdx = keyword ? searchStr.indexOf('{', idx) : idx;
        let openBraces = 0;
        let endIdx = -1;

        for (let i = startIdx; i < searchStr.length; i++) {
            if (searchStr[i] === '{') openBraces++;
            else if (searchStr[i] === '}') {
                openBraces--;
                if (openBraces === 0) {
                    endIdx = i;
                    break;
                }
            }
        }

        if (endIdx !== -1) {
            try {
                const jsonStr = searchStr.substring(startIdx, endIdx + 1);
                // Try parsing it directly
                results.push(JSON.parse(jsonStr));
            } catch (e) {
                // If it fails, try replacing \" with " and \\" with \"
                try {
                    let cleaned = searchStr.substring(startIdx, endIdx + 1)
                        .replace(/\\"/g, '"')
                        .replace(/\\\\/g, '\\');
                    results.push(JSON.parse(cleaned));
                } catch(e2) {}
            }
            searchStr = searchStr.substring(endIdx + 1);
        } else {
            break;
        }
    }
    return results;
}

async function testExtraction() {
    const res = await fetch('https://www.cricbuzz.com/cricket-full-commentary/148404/ind-vs-afg-2nd-odi-afghanistan-tour-of-india-2026/1');
    const html = await res.text();
    
    // In Next.js App Router, the data is pushed to self.__next_f
    let payloadStr = '';
    const $ = cheerio.load(html);
    $('script').each((i, el) => {
        const text = $(el).html() || '';
        if (text.includes('self.__next_f.push')) {
            payloadStr += text + '\n';
        }
    });

    // Try to extract commentaryList
    const comm = extractJsonObjects(payloadStr, 'commentaryList');
    console.log('Found commentaryList array of length:', comm.length);
    
    let totalBalls = 0;
    for (const item of comm) {
        if (item.commentaryList) {
            console.log(`Item has commentaryList with ${item.commentaryList.length} balls.`);
            totalBalls += item.commentaryList.length;
        }
    }
    console.log('Total balls found:', totalBalls);
}
testExtraction();
