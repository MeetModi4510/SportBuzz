import axios from 'axios';
import * as cheerio from 'cheerio';

async function testFull() {
    const matchId = 114175;
    const slug = 'match';
    const timestamp = Date.now();
    const fullUrl = `https://www.cricbuzz.com/live-cricket-full-commentary/${matchId}/${slug}?_t=${timestamp}`;
    console.log("Fetching", fullUrl);
    try {
        const res = await axios.get(fullUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0',
                'Accept': 'text/html',
                'Referer': 'https://www.cricbuzz.com/'
            }
        });
        const html = res.data;
        const markerIdx = html.indexOf('matchPreviewFullComm');
        console.log("Marker index:", markerIdx);
        
        if (markerIdx !== -1) {
            const scriptStart = html.lastIndexOf('self.__next_f.push', markerIdx);
            const scriptClose = html.indexOf('</script>', scriptStart);
            const rawScript = html.substring(scriptStart, scriptClose);
            const payloadMatch = rawScript.match(/self\.__next_f\.push\(\[1,"([\s\S]+?)"\]\)/);
            if (payloadMatch) {
                let unescaped;
                try { unescaped = JSON.parse('"' + payloadMatch[1] + '"'); }
                catch(e) { unescaped = payloadMatch[1].replace(/\\"/g, '"'); }
                
                const mpIdx = unescaped.indexOf('"matchPreviewFullComm":{');
                if (mpIdx !== -1) {
                    console.log("Found matchPreviewFullComm in RSC!");
                    const objStart = mpIdx + '"matchPreviewFullComm":'.length;
                    let braces = 0; let objEnd = objStart;
                    for (let i = objStart; i < unescaped.length; i++) {
                        if (unescaped[i] === '{') braces++;
                        else if (unescaped[i] === '}') braces--;
                        if (braces === 0 && i > objStart) { objEnd = i + 1; break; }
                    }
                    const obj = JSON.parse(unescaped.substring(objStart, objEnd));
                    console.log("Innings found:", obj.commentary?.length);
                    console.log("Total items in first inning:", obj.commentary?.[0]?.commentaryList?.length);
                } else {
                    console.log("Could not find matchPreviewFullComm object");
                }
            } else {
                console.log("Could not find payload match");
            }
        }
    } catch (e) {
        console.error(e.message);
    }
}
testFull();
