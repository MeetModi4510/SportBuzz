import axios from 'axios';

const headers = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' };

// Test with the ACTUAL IND vs SA T20 WC Final (not the wrong match that came up)
// Real: South Africa vs India, T20 WC 2024 Final - matchId 1415701
const res = await axios.get(
    'https://www.espncricinfo.com/series/icc-men-s-t20-world-cup-2024-1411166/south-africa-vs-india-final-1415701/ball-by-ball-commentary',
    { headers, timeout: 12000 }
);
const d = res.data;
const nextDataMatch = d.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
const nextData = JSON.parse(nextDataMatch[1]);

// Find the comments array
function findInObj(obj, key, depth = 0) {
    if (depth > 15 || !obj || typeof obj !== 'object') return null;
    if (obj[key] !== undefined) return obj[key];
    for (const k of Object.keys(obj)) {
        const result = findInObj(obj[k], key, depth + 1);
        if (result !== null) return result;
    }
    return null;
}

const comments = findInObj(nextData.props, 'comments');
if (comments && Array.isArray(comments)) {
    console.log(`Total comments: ${comments.length}`);
    
    // Find items that have text/shortText
    const withText = comments.filter(c => c.shortText || c.text || c.commText);
    console.log(`Comments WITH text: ${withText.length}`);
    
    // Show a few
    const ballComments = comments.filter(c => c.overNumber !== undefined && !Array.isArray(c.balls));
    console.log(`\nBall-level comments: ${ballComments.length}`);
    
    if (ballComments[0]) {
        console.log('\nSample ball comment keys:', Object.keys(ballComments[0]));
        console.log('Has shortText:', 'shortText' in ballComments[0]);
        console.log('shortText value:', ballComments[0].shortText);
    }
    
    // Check first 3 ball comments
    console.log('\n=== First 3 ball comments ===');
    ballComments.slice(0, 3).forEach((c, i) => {
        console.log(`\n[${i}] Over ${c.overNumber}.${c.ballNumber}: ${c.batsmanRuns} runs, 4=${c.isFour}, 6=${c.isSix}, W=${c.isWicket}`);
        console.log(`  shortText: ${c.shortText || '(none)'}`);
        console.log(`  text: ${c.text || '(none)'}`);
        console.log(`  All keys: ${Object.keys(c).join(', ')}`);
    });
} else {
    console.log('Could not find comments array');
}
