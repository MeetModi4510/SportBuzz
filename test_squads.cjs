const axios = require('axios');
const fs = require('fs');

async function test() {
    try {
        const res = await axios.get('https://www.cricbuzz.com/cricket-match-squads/129563/match', {
            headers: { 'User-Agent': 'Mozilla/5.0', 'RSC': '1', 'x-nextjs-data': '1' }
        });
        const raw = JSON.stringify(res.data);
        const unescaped = raw.replace(/\\"/g, '"');
        
        let foundData = {};

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
                    // What keys to look for? 'players', 'squads', 'team1', 'team2'?
                    if (obj.player || obj.players || obj.squad || obj.squads || obj.playingXI || obj.bench) {
                        foundData = { ...foundData, ...obj };
                    }
                } catch(e) {}
            }
            start++;
        }

        console.log("Keys found:", Object.keys(foundData));
        fs.writeFileSync('squads_extract.json', JSON.stringify(foundData, null, 2));

        // Let's also just dump the raw response to see if there's an obvious object
        fs.writeFileSync('squads_raw.txt', unescaped.substring(0, 5000));
    } catch (e) {
        console.error(e);
    }
}
test();
