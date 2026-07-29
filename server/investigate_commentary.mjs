import axios from 'axios';

// Test a completed match
const matchId = '89704';
const slug = 'rsa-vs-ind-final-icc-mens-t20-world-cup-2024';

const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Referer': 'https://www.cricbuzz.com/'
};

// URL patterns to try
const urls = [
    `https://www.cricbuzz.com/cricket-full-commentary/${matchId}/${slug}`,
    `https://www.cricbuzz.com/live-cricket-full-commentary/${matchId}/${slug}`,
    `https://www.cricbuzz.com/api/mcenter/full-commentary/${matchId}`,
    `https://www.cricbuzz.com/api/mcenter/commentary/${matchId}`,
    `https://www.cricbuzz.com/api/html/cricket-full-commentary/${matchId}`,
    `https://www.cricbuzz.com/api/html/cricket-commentary/${matchId}`,
];

for (const url of urls) {
    try {
        const res = await axios.get(url, { headers, timeout: 10000 });
        const data = typeof res.data === 'string' ? res.data : JSON.stringify(res.data);
        
        // Key things to look for
        const hasCommentary = data.includes('commentaryList') || data.includes('commLines') || data.includes('commText');
        const hasPreview = data.includes('matchPreviewFullComm');
        const hasNextF = data.includes('__next_f.push');
        const hasOverNum = data.includes('overNum') || data.includes('ballNbr');
        const hasFontBold = data.includes('font-bold');
        
        console.log(`\n✅ ${url}`);
        console.log(`   Size: ${data.length} chars | commentaryList: ${hasCommentary} | matchPreviewFullComm: ${hasPreview} | __next_f: ${hasNextF} | overNum: ${hasOverNum} | font-bold: ${hasFontBold}`);
        
        if (hasCommentary || hasPreview || hasOverNum) {
            // Show a snippet of the commentary area
            const idx = data.indexOf('commText') !== -1 ? data.indexOf('commText') : data.indexOf('commentaryList');
            if (idx !== -1) {
                console.log(`   SNIPPET: ...${data.substring(Math.max(0, idx-50), idx+200)}...`);
            }
        }
    } catch (e) {
        console.log(`\n❌ ${url} → ${e.response?.status || e.message}`);
    }
}

// Also check if Cricbuzz has a paginated API endpoint
const apiUrls = [
    `https://www.cricbuzz.com/api/html/commentary/${matchId}?InningsId=1&page=1`,
    `https://www.cricbuzz.com/api/html/commentary/${matchId}/1`,
    `https://www.cricbuzz.com/api/html/cricket-commentary/${matchId}/1/page`,
];

console.log('\n--- Checking Paginated API Endpoints ---');
for (const url of apiUrls) {
    try {
        const res = await axios.get(url, { headers, timeout: 10000 });
        const data = typeof res.data === 'string' ? res.data : JSON.stringify(res.data);
        const hasCommentary = data.includes('commText') || data.includes('commentaryList') || data.includes('commLines');
        console.log(`\n${hasCommentary ? '✅' : '⚠️'} ${url} → ${res.status} | Size: ${data.length} | commentary: ${hasCommentary}`);
        if (hasCommentary) console.log(`   SAMPLE: ${data.substring(0, 300)}`);
    } catch (e) {
        console.log(`\n❌ ${url} → ${e.response?.status || e.message}`);
    }
}
