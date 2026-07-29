const axios = require('axios');
const fs = require('fs');

async function test() {
    const res = await axios.get('https://www.cricbuzz.com/live-cricket-full-commentary/129480/eng-vs-ind');
    const html = res.data;
    const payloadMatch = html.match(/self\.__next_f\.push\(\[1,"([\s\S]+?)"\]\)/);
    
    let unescaped = payloadMatch[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\');
    const mpIdx = unescaped.indexOf('"matchPreviewFullComm":{');
    const objStart = mpIdx + '"matchPreviewFullComm":'.length;
    let braces=0, objEnd=objStart;
    
    for(let i=objStart; i<unescaped.length; i++){
        if(unescaped[i]==='{') braces++;
        else if(unescaped[i]==='}') braces--;
        
        if(braces===0 && i>objStart){
            objEnd=i+1;
            break;
        }
    }
    
    const obj = JSON.parse(unescaped.substring(objStart, objEnd));
    fs.writeFileSync('mpObj.json', JSON.stringify(obj, null, 2));
    console.log("Written to mpObj.json!");
}

test().catch(console.error);
