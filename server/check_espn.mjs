import axios from 'axios';

const headers = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' };

// Check ESPNcricinfo full commentary page (they have a dedicated /match-commentary/ URL)
const urls = [
    'https://www.espncricinfo.com/series/icc-men-s-t20-world-cup-2024-1411166/south-africa-vs-india-final-1415701/match-commentary',
    'https://www.espncricinfo.com/series/icc-men-s-t20-world-cup-2024-1411166/south-africa-vs-india-final-1415701/full-scorecard',
];

for (const url of urls) {
    try {
        const res = await axios.get(url, { headers, timeout: 12000 });
        const d = res.data;
        
        // Look for actual commentary text patterns
        const commentaryIdx = d.indexOf('commentary');
        const snippet = d.substring(Math.max(0, commentaryIdx - 20), commentaryIdx + 600);
        
        console.log(`\n=== ${url.split('/').slice(-1)[0]} ===`);
        console.log(`Size: ${d.length}`);
        console.log(`Has commentary key: ${d.includes('commentary')}`);
        console.log(`Has commText: ${d.includes('commText')}`);
        console.log(`Has event_type: ${d.includes('event_type')}`);
        console.log(`Has short_text: ${d.includes('short_text')}`);
        console.log(`Has play_desc: ${d.includes('play_desc')}`);
        console.log(`Has ball_runs: ${d.includes('ball_runs')}`);
        console.log(`COMMENTARY SNIPPET:\n${snippet}\n`);
    } catch(e) {
        console.log(`ERROR for ${url}: ${e.response?.status || e.message}`);
    }
}

// Also try ESPNcricinfo's dedicated commentary JSON endpoint
const matchId = '1415701';
const jsonUrls = [
    `https://hs-consumer-api.espncricinfo.com/v1/pages/match/comments?lang=en&seriesId=1411166&matchId=${matchId}&inningNumber=1&commentType=ALL&fromInningOver=-1`,
    `https://www.espncricinfo.com/comms/1415701.json`,
];

console.log('\n=== Checking ESPNcricinfo JSON API ===');
for (const url of jsonUrls) {
    try {
        const res = await axios.get(url, { headers, timeout: 12000 });
        const d = typeof res.data === 'string' ? res.data : JSON.stringify(res.data);
        console.log(`\n✅ ${url}`);
        console.log(`   Size: ${d.length} | Status: ${res.status}`);
        console.log(`   SAMPLE: ${d.substring(0, 400)}`);
    } catch(e) {
        console.log(`\n❌ ${url} → ${e.response?.status || e.message}`);
    }
}
