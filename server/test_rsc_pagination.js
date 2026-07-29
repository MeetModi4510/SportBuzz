import axios from 'axios';

async function testRscPagination() {
    const matchId = 129480; 
    let lastTimestamp = '';
    let loopCount = 0;

    while (loopCount < 2) {
        // Test with different parameter names: tms, lastTimestamp, timestamp
        let params = ``;
        if (lastTimestamp) {
            params = `&lastTimestamp=${lastTimestamp}&tms=${lastTimestamp}&timestamp=${lastTimestamp}`;
        }
        
        // This is the Next.js fetch URL that returns the RSC payload
        const url = `https://www.cricbuzz.com/live-cricket-full-commentary/${matchId}/match?_t=${Date.now()}${params}`;
        console.log(`\nFetching: ${url}`);
        
        try {
            const res = await axios.get(url, {
                headers: {
                    'Rsc': '1',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
                }
            });

            // Use match with non-greedy up to the next key, or just find it roughly and eval
            const str = res.data;
            const startIdx = str.indexOf('"commentaryList":');
            if (startIdx !== -1) {
                const arrayStart = str.indexOf('[', startIdx);
                let openBrackets = 0;
                let arrayEnd = -1;
                let inString = false;
                let escapeNext = false;

                for (let i = arrayStart; i < str.length; i++) {
                    const char = str[i];
                    if (escapeNext) {
                        escapeNext = false;
                        continue;
                    }
                    if (char === '\\') {
                        escapeNext = true;
                        continue;
                    }
                    if (char === '"') {
                        inString = !inString;
                        continue;
                    }
                    if (!inString) {
                        if (char === '[') openBrackets++;
                        if (char === ']') {
                            openBrackets--;
                            if (openBrackets === 0) {
                                arrayEnd = i;
                                break;
                            }
                        }
                    }
                }

                if (arrayEnd !== -1) {
                    let arrayStr = str.substring(arrayStart, arrayEnd + 1);
                    // RSC encodes quotes and newlines, we need to handle it or just eval
                    arrayStr = arrayStr.replace(/\\\\"/g, '\\"').replace(/\\\\n/g, '\\n');
                    
                    try {
                        const comms = JSON.parse(arrayStr);
                        console.log(`Extracted ${comms.length} commentary items.`);
                        if (comms.length > 0) {
                            console.log(`First item: Over ${comms[0].overNum}.${comms[0].ballNbr} - ${comms[0].commText?.substring(0, 30)}`);
                            console.log(`Last item: Over ${comms[comms.length-1].overNum}.${comms[comms.length-1].ballNbr} - ${comms[comms.length-1].commText?.substring(0, 30)}`);
                            
                            const newTimestamp = comms[comms.length-1].timestamp;
                            console.log(`Found timestamp at end of list: ${newTimestamp}`);
                            
                            if (!newTimestamp || newTimestamp === lastTimestamp) {
                                console.log("No new timestamp. Stopping.");
                                break;
                            }
                            lastTimestamp = newTimestamp;
                        }
                    } catch (e) {
                         console.error(`Parse Error:`, e.message);
                         break;
                    }
                }
            } else {
                console.log("No commentaryList found in RSC payload.");
                break;
            }
        } catch (e) {
            console.error(`Error: ${e.message}`);
            break;
        }
        loopCount++;
    }
}

testRscPagination();
