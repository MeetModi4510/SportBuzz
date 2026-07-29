import axios from 'axios';

const idsToCheck = [264914, 264915, 264916, 264917, 264918];

for (const id of idsToCheck) {
    const url = `https://www.hindustantimes.com/static-content/10s/commentary_${id}_1.json`;
    try {
        const res = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 8000 });
        const data = res.data;
        const commentary = Array.isArray(data) ? data : (data.commentary || data.Commentary || []);
        if (commentary.length > 0) {
            const first = commentary[commentary.length - 1]; // oldest ball (first of innings)
            const last  = commentary[0];                      // newest ball (last of innings)
            console.log(`\n=== ID ${id} (${commentary.length} balls) ===`);
            console.log(`  FIRST ball → Bowler: "${first.Bowler_Name||first.Bowler_Short_Name}" | Batsman: "${first.Batsman_Name||first.Batsman_Short_Name}" | Over: "${first.Over}" | Commentary: "${(first.Commentary||first.Default_Commentary||'').slice(0,80)}"`);
            console.log(`  LAST  ball → Bowler: "${last.Bowler_Name ||last.Bowler_Short_Name}" | Batsman: "${last.Batsman_Name ||last.Batsman_Short_Name}"  | Commentary: "${(last.Commentary||last.Default_Commentary||'').slice(0,80)}"`);
            // check matchId
            console.log(`  matchId: ${first.matchId}`);
        }
    } catch(e) {
        console.log(`ID ${id}: ${e.message}`);
    }
}
