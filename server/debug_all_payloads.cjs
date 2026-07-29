const axios = require('axios');
const fs = require('fs');

async function test() {
    const res = await axios.get('https://www.cricbuzz.com/live-cricket-full-commentary/129480/eng-vs-ind');
    const html = res.data;
    
    // Find all Next.js JSON payloads
    const regex = /self\.__next_f\.push\(\[1,"([\s\S]+?)"\]\)/g;
    let match;
    let allData = [];
    
    while ((match = regex.exec(html)) !== null) {
        let unescaped = match[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\');
        // Unescape \n
        unescaped = unescaped.replace(/\\n/g, '');
        allData.push(unescaped);
    }
    
    fs.writeFileSync('all_payloads.txt', allData.join('\n\n=====\n\n'));
    console.log("Written to all_payloads.txt");
}

test().catch(console.error);
