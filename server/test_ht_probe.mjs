import axios from 'axios';

// The July 19 match is ID 264919. Try nearby IDs to find July 16 match.
const baseId = 264919;
const range = 15; // check 15 IDs before and after

console.log(`Probing CDN IDs around ${baseId} to find the July 16 India vs England ODI...\n`);

const found = [];

for (let offset = -range; offset <= 0; offset++) {
    const id = baseId + offset;
    const url = `https://www.hindustantimes.com/static-content/10s/commentary_${id}_1.json`;
    try {
        const res = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            timeout: 6000,
            validateStatus: s => s < 500
        });
        if (res.status === 200 && res.data) {
            // Try to pull team names from commentary
            const data = res.data;
            const commentary = Array.isArray(data) ? data : (data.commentary || data.Commentary || []);
            if (commentary.length > 0) {
                const sample = commentary[0];
                const t1 = sample.Batting_Team || sample.Team_1 || sample.Home_Team || '';
                const t2 = sample.Bowling_Team || sample.Team_2 || sample.Away_Team || '';
                const bowler = sample.Bowler_Name || sample.Bowler_Short_Name || '';
                const batsman = sample.Batsman_Name || sample.Batsman_Short_Name || '';
                console.log(`✅ ID ${id}: ${commentary.length} balls | bowler=${bowler} batsman=${batsman} | t1=${t1} t2=${t2}`);
                found.push(id);
            } else {
                console.log(`⚠️  ID ${id}: 200 OK but empty commentary array`);
            }
        } else {
            process.stdout.write(`  ID ${id}: ${res.status}\n`);
        }
    } catch(e) {
        process.stdout.write(`  ID ${id}: ERROR ${e.code || e.message}\n`);
    }
}

console.log(`\nFound ${found.length} IDs with data: ${found.join(', ')}`);
