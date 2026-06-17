const axios = require('axios');
const fs = require('fs');

async function test() {
    try {
        const res = await axios.get('https://www.cricbuzz.com/cricket-match-squads/129563/match', {
            headers: { 'User-Agent': 'Mozilla/5.0', 'RSC': '1', 'x-nextjs-data': '1' }
        });
        const raw = JSON.stringify(res.data);
        const unescaped = raw.replace(/\\"/g, '"');
        
        let foundObjects = [];

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
                    // Check if it's a squad object (contains playing XI or bench)
                    if (obj['playing XI'] || obj.bench || obj.team) {
                        foundObjects.push(obj);
                    }
                } catch(e) {}
            }
            start++;
        }

        fs.writeFileSync('squads_array.json', JSON.stringify(foundObjects, null, 2));
        console.log("Found objects:", foundObjects.length);
        foundObjects.forEach((o, i) => console.log(`Object ${i} keys:`, Object.keys(o), o.team ? o.team.name : 'No team name'));

    } catch (e) {
        console.error(e);
    }
}
test();
