const axios = require('axios');

async function test() {
    try {
        const res = await axios.get('https://www.cricbuzz.com/live-cricket-scores/129563/match', {
            headers: { 'User-Agent': 'Mozilla/5.0', 'RSC': '1', 'x-nextjs-data': '1' }
        });
        const raw = JSON.stringify(res.data);
        const unescaped = raw.replace(/\\\"/g, '"');
        
        let foundData = {};

        // Find all JSON objects in the unescaped string
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
                    const obj = JSON.parse(unescaped.substring(start, end));
                    if (obj.matchId === 129563 || obj.matchInfo?.matchId === 129563) {
                        foundData = { ...foundData, ...obj };
                    }
                } catch(e) {}
            }
            start++;
        }

        console.log("Found keys:", Object.keys(foundData));
        if (foundData.umpire1) console.log("Umpire 1:", foundData.umpire1);
        if (foundData.tossResults) console.log("Toss:", foundData.tossResults);
        if (foundData.miniscore) console.log("Batter:", foundData.miniscore.batsmanStriker);
        if (foundData.winProbability) console.log("Win:", foundData.winProbability);
        
        const fs = require('fs');
        fs.writeFileSync('full_extract.json', JSON.stringify(foundData, null, 2));
    } catch (e) {
        console.error(e);
    }
}
test();
