import axios from 'axios';

// Verify timestamps in CDN data for IDs 264917–264919
const idsToCheck = [264917, 264918, 264919];
const targetTs = new Date('2026-07-16').getTime();

console.log(`Target date: July 16, 2026 (ts=${targetTs})\n`);

for (const id of idsToCheck) {
    const url = `https://www.hindustantimes.com/static-content/10s/commentary_${id}_1.json`;
    try {
        const res = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 8000 });
        const data = res.data;
        const commentary = Array.isArray(data) ? data : (data.commentary || data.Commentary || []);
        if (commentary.length > 0) {
            const oldest = commentary[commentary.length - 1]; // first ball of match
            const newest = commentary[0];
            const ballTs = oldest.commentaryTimestamp || oldest.Timestamp || 0;
            const diffDays = Math.abs(targetTs - Number(ballTs)) / (1000 * 60 * 60 * 24);
            const ballDate = new Date(Number(ballTs)).toISOString().split('T')[0];
            console.log(`ID ${id}: ${commentary.length} balls | first ball ts=${ballTs} (${ballDate}) | diff from Jul 16 = ${diffDays.toFixed(1)} days`);
        }
    } catch(e) {
        console.log(`ID ${id}: ${e.message}`);
    }
}
